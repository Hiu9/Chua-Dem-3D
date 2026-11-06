import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';
import rideConfig from '../ride-config.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const rooms = new Map();
const capacity = 100;
const roomLimit = 8;
const socketsLimit = 900;
const { rideStation, rideSchedule, rideCooldown, rideVersion } = rideConfig;
const roomCode = /^[A-Z0-9-]{3,16}$/;
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.mp3': 'audio/mpeg'
};
const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size, players: [...rooms.values()].reduce((sum, room) => sum + room.players.size, 0) }));
    return;
  }
  if (!['GET', 'HEAD'].includes(req.method) || !/^(?:\/|\/[\w-]+\.(?:html|css|js)|\/vendor\/[\w.-]+\.(?:js|txt)|\/assets\/(?:background-music|wooden-fish)\.mp3)$/.test(path)) {
    res.writeHead(404).end();
    return;
  }
  const file = resolve(root, '.' + (path === '/' ? '/index.html' : path));
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not a file');
    const type = types[extname(file)];
    const headers = { 'Content-Type': type, 'Content-Length': info.size, 'X-Content-Type-Options': 'nosniff' };
    let status = 200, streamOptions;
    if (type === 'audio/mpeg') {
      headers['Accept-Ranges'] = 'bytes';
      const range = req.headers.range;
      if (range) {
        const parts = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!parts || (!parts[1] && !parts[2])) {
          res.writeHead(416, { 'Content-Range': 'bytes */' + info.size }).end();
          return;
        }
        const start = parts[1] ? Number(parts[1]) : Math.max(0, info.size - Number(parts[2]));
        const end = parts[1] && parts[2] ? Math.min(info.size - 1, Number(parts[2])) : info.size - 1;
        if (start > end || start >= info.size) {
          res.writeHead(416, { 'Content-Range': 'bytes */' + info.size }).end();
          return;
        }
        streamOptions = { start, end };
        status = 206;
        headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + info.size;
        headers['Content-Length'] = end - start + 1;
      }
    }
    res.writeHead(status, headers);
    if (req.method === 'HEAD') res.end();
    else createReadStream(file, streamOptions).on('error', () => res.destroy()).pipe(res);
  } catch { res.writeHead(404).end(); }
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });
const send = (socket, message) => {
  if (socket.readyState === WebSocket.OPEN && socket.bufferedAmount < 262144) {
    socket.send(typeof message === 'string' ? message : JSON.stringify(message));
  }
};
server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/room' || wss.clients.size >= socketsLimit ||
      (allowedOrigins?.length && !allowedOrigins.includes(req.headers.origin))) {
    socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
    return;
  }
  wss.handleUpgrade(req, socket, head, (client) => wss.emit('connection', client));
});

function clearClaim(player, room) {
  if (player.claim) room.claims.delete(player.claim);
  player.claim = null;
}

function expireRide(room, now) {
  if (!room.ride || now < room.ride.arrival + rideCooldown) return;
  for (const player of room.players.values()) {
    if (player.claim?.startsWith('ride:')) clearClaim(player, room);
  }
  room.ride = null;
}

wss.on('connection', (socket) => {
  let room, code, player;
  let budget = 32;
  let replenished = Date.now();
  socket.alive = true;
  const joinTimeout = setTimeout(() => socket.close(1008, 'join timeout'), 8000);
  socket.on('pong', () => { socket.alive = true; });
  socket.on('error', () => socket.terminate());
  socket.on('message', (raw, binary) => {
    const now = Date.now();
    budget = Math.min(32, budget + (now - replenished) * .018);
    replenished = now;
    if (binary || budget < 1) return;
    budget--;
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || typeof msg !== 'object') return;
    if (!player && msg.type === 'join' && typeof msg.code === 'string' && roomCode.test(msg.code)) {
      code = msg.code;
      room = rooms.get(code);
      if ((!room && rooms.size >= roomLimit) || (room && room.players.size >= capacity)) {
        send(socket, { type: 'error', text: room ? 'Phòng đã đủ 100 người.' : 'Máy chủ đã hết phòng.' });
        socket.close(1008, 'capacity');
        return;
      }
      if (!room) {
        room = { players: new Map(), claims: new Map(), ride: null };
        rooms.set(code, room);
      }
      player = { id: randomUUID().slice(0, 12), socket, x: 0, z: 18, angle: 3.14, outfit: 0, name: 'Khách', claim: null };
      room.players.set(player.id, player);
      clearTimeout(joinTimeout);
      send(socket, { type: 'welcome', id: player.id, now, rideVersion, ride: room.ride });
      return;
    }
    if (!player) return;
    if (msg.type === 'pose') {
      if (![msg.x, msg.z, msg.angle].every(Number.isFinite) || Math.abs(msg.x) > 33 || msg.z < -59 || msg.z > 27) return;
      player.x = Math.round(msg.x * 100) / 100;
      player.z = Math.round(msg.z * 100) / 100;
      player.angle = Math.round(Math.atan2(Math.sin(msg.angle), Math.cos(msg.angle)) * 100) / 100;
      if (Number.isInteger(msg.outfit) && msg.outfit >= 0 && msg.outfit < 4) player.outfit = msg.outfit;
      if (typeof msg.name === 'string') player.name = msg.name.trim().slice(0, 20) || 'Khách';
    }
    if (msg.type === 'release') clearClaim(player, room);
    if (msg.type === 'claim' && Number.isInteger(msg.request)) {
      const kind = msg.kind;
      const order = Array.isArray(msg.order) ? msg.order.slice(0, 100) : [];
      expireRide(room, now);
      const ride = kind === 'ride';
      const nearRide = Math.hypot(player.x - rideStation.x, player.z - rideStation.z) <= rideStation.radius + .6;
      const nearHall = Math.abs(player.x) < 13.7 && player.z > -31.2 && player.z < -7;
      const open = kind === 'meditation' ? nearHall : ride && nearRide && (!room.ride || now < room.ride.departure);
      let seat = -1;
      if (!player.claim && open) {
        seat = order.find((n) => Number.isInteger(n) && n >= 0 && n < (ride ? 10 : 100) && !room.claims.has(kind + ':' + n)) ?? -1;
        if (seat >= 0) {
          player.claim = kind + ':' + seat;
          if (ride && !room.ride) room.ride = rideSchedule(now);
          room.claims.set(player.claim, player.id);
        }
      }
      send(socket, { type: 'claim', request: msg.request, seat, ride: ride ? room.ride : null });
    }
  });
  socket.on('close', () => {
    clearTimeout(joinTimeout);
    if (!player) return;
    clearClaim(player, room);
    room.players.delete(player.id);
    if (!room.players.size) rooms.delete(code);
  });
});

setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    expireRide(room, now);
    const list = [];
    for (const p of room.players.values()) {
      list.push([p.id, p.x, p.z, p.angle, p.outfit, p.name, p.claim]);
    }
    const snapshot = JSON.stringify({ type: 'snapshot', now, ride: room.ride, players: list });
    for (const p of room.players.values()) send(p.socket, snapshot);
  }
}, 125).unref();

setInterval(() => {
  for (const socket of wss.clients) {
    if (!socket.alive || socket.bufferedAmount > 262144) socket.terminate();
    else {
      socket.alive = false;
      socket.ping();
    }
  }
}, 25000).unref();

const port = Number(process.env.PORT || 8080);
server.listen(port, '0.0.0.0', () => console.log('Chua Dem listening on port ' + port));
