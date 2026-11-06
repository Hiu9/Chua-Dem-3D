'use strict';

function createOnlineRoom({ update, receive, disconnected, joined }) {
  let socket, playerId, sequence = 0, clockOffset = 0, lastSent = 0;
  let lastPose, currentRide;
  const requests = new Map();
  const running = () => Boolean(playerId) && socket?.readyState === WebSocket.OPEN;
  function rejectRequests() {
    for (const request of requests.values()) {
      clearTimeout(request.timer);
      request.done(-1, null);
    }
    requests.clear();
  }
  function leave() {
    const old = socket;
    socket = undefined;
    playerId = undefined;
    clockOffset = 0;
    currentRide = undefined;
    rejectRequests();
    receive([]);
    if (old) old.close();
    disconnected();
    update('Chơi đơn');
  }
  function join(url, code) {
    leave();
    let address;
    try { address = new URL(url); } catch { update('Địa chỉ máy chủ không hợp lệ.'); return; }
    if (!['ws:', 'wss:'].includes(address.protocol) || (location.protocol === 'https:' && address.protocol !== 'wss:')) {
      update('Trang HTTPS cần máy chủ wss://.');
      return;
    }
    if (!/^[A-Z0-9-]{3,16}$/.test(code)) {
      update('Mã phòng cần 3–16 ký tự A–Z, số hoặc dấu gạch ngang.');
      return;
    }
    let connection;
    try { connection = new WebSocket(address); }
    catch { update('Không thể mở kết nối với địa chỉ này.'); return; }
    update('Đang kết nối…');
    socket = connection;
    let failure;
    connection.addEventListener('open', () => {
      if (socket === connection) connection.send(JSON.stringify({ type: 'join', code }));
    });
    connection.addEventListener('message', (event) => {
      if (socket !== connection) return;
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      if (message.type === 'error') {
        failure = message.text;
        update(failure);
      }
      if (message.type === 'welcome') {
        if (message.rideVersion !== rideVersion) {
          failure = 'Máy chủ cần được cập nhật lên cùng phiên bản game.';
          connection.close();
          return;
        }
        currentRide = message.ride;
        playerId = message.id;
        clockOffset = message.now - Date.now();
        lastSent = 0;
        if (lastPose) pose(...lastPose);
        joined();
      }
      if (message.type === 'snapshot' && playerId && Array.isArray(message.players)) {
        currentRide = message.ride;
        clockOffset = clockOffset * .90 + (message.now - Date.now()) * .10;
        update(code + ' · ' + message.players.length + '/100');
        receive(message.players.filter(([id]) => id !== playerId));
      }
      if (message.type === 'claim') {
        const request = requests.get(message.request);
        if (!request) {
          if (message.seat >= 0) release();
          return;
        }
        clearTimeout(request.timer);
        requests.delete(message.request);
        if (message.ride) currentRide = message.ride;
        request.done(message.seat, message.ride);
      }
    });
    connection.addEventListener('close', () => {
      if (socket !== connection) return;
      leave();
      update(failure || 'Mất kết nối · Chơi đơn');
    });
  }
  function pose(x, z, angle, profile, force = false) {
    lastPose = [x, z, angle, profile];
    if (!running() || (!force && performance.now() - lastSent < 120)) return;
    lastSent = performance.now();
    socket.send(JSON.stringify({
      type: 'pose', x, z, angle, name: profile.nickname,
      outfit: ['jade', 'coral', 'cream', 'purple'].indexOf(profile.outfit)
    }));
  }
  function claim(kind, order, done) {
    if (!running()) {
      done(order[0] ?? -1, kind === 'ride' ? rideSchedule(Date.now(), 650) : null);
      return;
    }
    const request = ++sequence;
    const timer = setTimeout(() => {
      requests.delete(request);
      done(-1, null);
    }, 2200);
    requests.set(request, { done, timer });
    socket.send(JSON.stringify({ type: 'claim', kind, order, request }));
  }
  function release() {
    if (running()) socket.send(JSON.stringify({ type: 'release' }));
  }
  return { join, leave, pose, claim, release, running, ride: () => currentRide, clock: () => Date.now() + clockOffset };
}
