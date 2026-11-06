'use strict';

const byId = (id) => document.getElementById(id);
const view = byId('view');
const creator = byId('creator');
const profileForm = byId('profile');
const eventDialog = byId('event');
const roomDialog = byId('room-dialog');
const activityHud = byId('activity-hud');
const interact = byId('interact');
const taskList = [...document.querySelectorAll('[data-task]')];
const moveButtons = [...document.querySelectorAll('[data-move]')];
const storageKey = 'chua-dem-3d-v1';
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const initial = { nickname: '', skin: 'peach', hair: 'short', outfit: 'jade' };

function load() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
  catch { return {}; }
}

function profileFrom(source) {
  return {
    nickname: typeof source.nickname === 'string' ? source.nickname.trim().slice(0, 20) : '',
    hair: ['short', 'bun', 'long'].includes(source.hair) ? source.hair : initial.hair,
    skin: ['peach', 'gold', 'brown'].includes(source.skin) ? source.skin : initial.skin,
    outfit: ['jade', 'coral', 'cream', 'purple'].includes(source.outfit) ? source.outfit : initial.outfit
  };
}

const saved = load();
let profile = profileFrom(saved.profile || {});
const tasks = new Set(taskList.map((item) => item.dataset.task).filter((id) => Array.isArray(saved.tasks) && saved.tasks.includes(id)));
let started = false;
let active;
let breathStart = null;
let fishing;
let escort;
let seat;
let boardingPending = false;
let setGuide;
let joinSeat;
let nearbyPose;
let bellCount = 0;
let toastTimer;
let muted = true;
let audio;
let drag;
let yaw = 0;
let walkTo;
let walkClock = 0;
let lastFrame = performance.now();
const keys = new Set();
const touchKeys = new Map();
const hints = {
  meet: 'Qua cổng và làm quen với Thích Trung Hiếu ở sân chùa.',
  lotus: 'Hồ sen ở bên trái sân chùa.',
  bell: 'Qua mái nhỏ phía bên phải sân để gõ mõ.',
  breath: 'Qua cửa chánh điện rồi đi theo thảm giữa đến điểm Hít thở.',
  incense: 'Đến bàn hương ở cuối chánh điện.',
  escort: 'Hỏi Thích Trung Hiếu ao câu cá ở đâu, rồi đi theo thầy.',
  fish: 'Ra ao sau chùa và giật cần khi cá cắn câu.',
  meditate: 'Chọn Ngồi thiền ở khu đệm trong chánh điện.',
  caro: 'Ghé mái cờ bên trái sân và chơi một ván với Thích Thể Hiện.',
  coaster: 'Đến ga cạnh hồ sen bên trái sân và ngồi hết một vòng.'
};

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify({ profile, tasks: [...tasks] })); }
  catch { /* The current session remains playable. */ }
}

let world;
try { world = createWorld(window.THREE, view); }
catch {
  byId('error').hidden = false;
  byId('error').textContent = 'Game cần WebGL để hiển thị 3D. Hãy thử Chrome hoặc Edge với tính năng tăng tốc đồ họa được bật.';
  byId('enter').disabled = true;
  creator.showModal();
}

const online = createOnlineRoom({
  update(text) {
    const status = byId('room-status');
    if (status.textContent !== text) status.textContent = text;
    const count = byId('room-count');
    count.hidden = !online.running();
    if (!count.hidden && count.textContent !== text) count.textContent = text;
  },
  joined() { if (roomDialog.open) roomDialog.close(); },
  receive(players) { world?.expansion.setGuests(players); },
  disconnected() { if (seat) stopSeat(false); }
});
if (world) startGame();

byId('room-open').addEventListener('click', () => {
  clearMovement();
  const query = new URLSearchParams(location.search);
  const url = byId('room-url');
  if (!url.value) {
    url.value = query.get('server') || (location.protocol.startsWith('http') && !location.hostname.endsWith('github.io')
      ? (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/room' : '');
  }
  if (query.has('room') && !online.running()) byId('room-code').value = query.get('room');
  roomDialog.showModal();
});
byId('room-form').addEventListener('submit', (event) => {
  event.preventDefault();
  online.join(byId('room-url').value.trim(), byId('room-code').value.trim().toUpperCase());
});
byId('room-close').addEventListener('click', () => roomDialog.close());
byId('room-leave').addEventListener('click', online.leave);

function startGame() {
  const { camera, renderer, scene } = world;
  const T = window.THREE;
  let avatar = world.person(profile);
  const spawn = new T.Vector3(0, 0, 18);
  const position = spawn.clone();
  const desiredCamera = new T.Vector3();
  const target = new T.Vector3();
  const ray = new T.Raycaster();
  const floor = new T.Plane(new T.Vector3(0, 1, 0), 0);
  const hit = new T.Vector3();
  view.addEventListener('pointerup', (event) => {
    if (!drag || event.pointerId !== drag.id || drag.distance > 7) return;
    const bounds = view.getBoundingClientRect();
    ray.setFromCamera(new T.Vector2(
      (event.clientX - bounds.left) / bounds.width * 2 - 1,
      1 - (event.clientY - bounds.top) / bounds.height * 2
    ), camera);
    if (ray.ray.intersectPlane(floor, hit) && world.canStand(hit.x, hit.z)) {
      walkTo = hit.clone();
    }
  });
  let facing = 0;
  let indoor = false;
  let snapCamera = true;
  let zone = 'CỔNG CHÙA';
  let wasRiding = false;
  const { hall, expansion, meditationSeats } = world;
  const setPlayer = (x, z, angle) => {
    position.set(x, 0, z);
    facing = angle;
    snapCamera = true;
  };
  const guestStation = world.stations.find((station) => station.id === 'meet');

  setGuide = () => {
    escort = { index: 0 };
    notify('Đi theo Thích Trung Hiếu. Thầy sẽ chờ nếu bạn đi chậm.');
  };

  function followGuide(dt) {
    if (!escort) return;
    const npc = expansion.npc;
    const point = npc.root.position;
    const goal = guideRoute[escort.index];
    const gap = point.distanceTo(position);
    const x = goal[0] - point.x, z = goal[1] - point.z;
    const length = Math.hypot(x, z);
    if (gap < 9 && length > .11) {
      const step = Math.min(length, dt * 3.12);
      point.x += x * step / length;
      point.z += z * step / length;
      npc.root.rotation.y = Math.atan2(x, z);
      npc.limbs.forEach(({ arm, leg, side }) => {
        leg.rotation.x = Math.sin(walkClock) * side * .43;
        arm.rotation.x = -leg.rotation.x * .64;
      });
    } else {
      npc.limbs.forEach(({ arm, leg }) => { leg.rotation.x = arm.rotation.x = 0; });
    }
    if (length <= .11 && escort.index < guideRoute.length - 1) escort.index++;
    else if (length <= .11 && gap < 3.8) {
      escort = undefined;
      complete('escort');
      notify('Đã đến ao câu cá. Đến gần cầu gỗ và bấm Câu cá.');
    }
    guestStation.x = point.x;
    guestStation.z = point.z;
    guestStation.sign.position.set(point.x, 2.12, point.z);
  }

  joinSeat = (kind) => {
    if (boardingPending || seat) return;
    if (kind === 'ride' && online.ride()?.departure <= online.clock()) {
      notify('Tàu đang chạy. Hãy chờ đếm ngược tại ga.');
      return;
    }
    const order = kind === 'ride' ? Array.from({ length: 10 }, (_, i) => i)
      : meditationSeats.map(({ x, z }, i) => [i, Math.hypot(x - position.x, z - position.z)])
        .sort((a, b) => a[1] - b[1]).map(([i]) => i);
    const eventTag = byId('event-tag').textContent;
    boardingPending = true;
    online.pose(position.x, position.z, facing, profile, true);
    online.claim(kind, order, (index, ride) => {
      boardingPending = false;
      if (index < 0) { notify('Chưa giữ được chỗ. Hãy thử lại.'); return; }
      if (!eventDialog.open || byId('event-tag').textContent !== eventTag) { online.release(); return; }
      seat = { kind, index, start: performance.now(), ride, progress: 0 };
      if (kind === 'meditation') {
        const spot = meditationSeats[index];
        setPlayer(spot.x, spot.z, Math.PI);
      }
      eventDialog.close();
      activityHud.hidden = false;
      byId('activity-stop').textContent = 'Đứng dậy';
      byId('activity-stop').hidden = kind === 'ride';
      snapCamera = true;
    });
  };

  function sitOnSeat(now, clock) {
    if (!seat) return;
    const { kind, index, start, ride, progress } = seat;
    if (kind === 'ride') {
      wasRiding = true;
      const pose = expansion.rideSeat(index);
      avatar.root.position.copy(pose.position);
      avatar.root.rotation.y = pose.facing;
      const status = clock < ride.departure
        ? 'Ghế ' + (index + 1) + '/10 · Tàu sắp khởi hành'
        : 'Ghế ' + (index + 1) + '/10 · Đã đi ' + Math.floor(progress * 100) + '% vòng';
      if (byId('activity-text').textContent !== status) byId('activity-text').textContent = status;
      if (progress >= 1) {
        complete('coaster');
        notify('Tàu đã về ga hồ sen. Bạn đã đi trọn một vòng!');
        stopSeat();
      }
    } else {
      const remaining = Math.max(0, Math.ceil((12000 - (now - start)) / 1000));
      byId('activity-text').textContent = 'Đệm ' + (index + 1) + '/100 · ' + (remaining ? 'Thiền thêm ' + remaining + ' giây' : 'Đã hoàn thành');
      if (!remaining) complete('meditate');
    }
    avatar.body.position.y = -.34;
    avatar.limbs.forEach(({ leg, arm, side }) => {
      leg.rotation.x = -1.18;
      leg.rotation.z = side * .39;
      arm.rotation.x = -.31;
    });
  }

  function replaceAvatar() {
    scene.remove(avatar.root);
    avatar.root.traverse((node) => {
      if (node.isMesh && node.geometry.type === 'CircleGeometry') {
        node.geometry.dispose();
        node.material.dispose();
      }
    });
    avatar = world.person(profile);
  }

  function edit() {
    byId('creator-title').textContent = started ? 'Chỉnh nhân vật' : 'Tạo nhân vật';
    profileForm.elements.nickname.value = profile.nickname;
    profileForm.elements.hair.value = profile.hair;
    profileForm.elements.skin.value = profile.skin;
    profileForm.elements.outfit.value = profile.outfit;
    byId('enter').firstChild.textContent = started ? 'Lưu nhân vật ' : 'Vào sân chùa ';
    clearMovement();
    creator.showModal();
  }

  profileForm.addEventListener('input', () => {
    const next = profileFrom(Object.fromEntries(new FormData(profileForm)));
    const original = profile;
    profile = next;
    replaceAvatar();
    profile = original;
  });
  creator.addEventListener('cancel', (event) => {
    if (!started) event.preventDefault();
  });
  creator.addEventListener('close', replaceAvatar);
  profileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    profile = profileFrom(Object.fromEntries(new FormData(profileForm)));
    if (!profile.nickname) profile.nickname = 'Khách ghé chùa';
    save();
    if (!started) {
      started = true;
      position.copy(spawn);
      yaw = 0;
      facing = Math.PI;
      snapCamera = true;
      notify('Chào ' + profile.nickname + '! Hãy đi qua cổng chùa.');
    }
    creator.close();
    view.focus();
  });
  byId('edit').addEventListener('click', edit);
  view.tabIndex = -1;
  edit();
  updateJournal();

  function handleMovement(dt) {
    const held = (code) => keys.has(code) || [...touchKeys.values()].includes(code);
    let forward = Number(held('KeyW') || held('ArrowUp')) - Number(held('KeyS') || held('ArrowDown'));
    let sideways = Number(held('KeyD') || held('ArrowRight')) - Number(held('KeyA') || held('ArrowLeft'));
    let length = Math.hypot(forward, sideways);
    if (length) walkTo = undefined;
    if (walkTo) {
      const x = walkTo.x - position.x, z = walkTo.z - position.z;
      if (Math.hypot(x, z) < .23) walkTo = undefined;
      else {
        forward = -Math.sin(yaw) * x - Math.cos(yaw) * z;
        sideways = Math.cos(yaw) * x - Math.sin(yaw) * z;
        length = Math.hypot(forward, sideways);
      }
    }
    let moving = false;
    if (started && !seat && !creator.open && !eventDialog.open && !roomDialog.open && length) {
      forward /= length;
      sideways /= length;
      const dx = -Math.sin(yaw) * forward + Math.cos(yaw) * sideways;
      const dz = -Math.cos(yaw) * forward - Math.sin(yaw) * sideways;
      const speed = 4.35;
      const oldX = position.x, oldZ = position.z;
      if (world.canStand(position.x + dx * speed * dt, position.z)) position.x += dx * speed * dt;
      if (world.canStand(position.x, position.z + dz * speed * dt)) position.z += dz * speed * dt;
      moving = oldX !== position.x || oldZ !== position.z;
      if (!moving && dt > 0) walkTo = undefined;
      const desired = Math.atan2(dx, dz);
      facing += Math.atan2(Math.sin(desired - facing), Math.cos(desired - facing)) * Math.min(1, dt * 14);
    }
    walkClock += dt * 10;
    avatar.root.position.copy(position);
    avatar.root.rotation.y = started ? facing : -.54 + (motion.matches ? 0 : Math.sin(walkClock * .12) * .24);
    avatar.body.position.y = moving && !motion.matches ? Math.abs(Math.sin(walkClock)) * .042 : 0;
    avatar.limbs.forEach(({ arm, leg, side }) => {
      const swing = moving ? side * Math.sin(walkClock) * .53 : 0;
      leg.rotation.x = swing;
      leg.rotation.z = 0;
      arm.rotation.x = -swing * .73;
    });
  }

  function trackCamera(dt, now) {
    const inside = position.z < hall.front && position.z > hall.back && Math.abs(position.x) < hall.x;
    if (inside !== indoor) {
      indoor = inside;
      snapCamera = true;
    }
    world.templeRoof.visible = !indoor;
    const narrow = view.clientWidth < 700;
    if (seat?.kind === 'ride') {
      const pose = expansion.rideSeat(seat.index);
      desiredCamera.copy(pose.position).add(new T.Vector3(-Math.sin(pose.facing) * 4.5, 2.55, -Math.cos(pose.facing) * 4.5));
      target.copy(pose.position).add(new T.Vector3(Math.sin(pose.facing) * 2.2, .65, Math.cos(pose.facing) * 2.2));
    } else if (!started) {
      const drift = motion.matches ? 0 : Math.sin(now * .00048);
      desiredCamera.set(-2.8 + drift * .52, 2.70 + drift * .14, narrow ? 23.8 : 23.1);
      target.set(narrow ? -.15 : .8, narrow ? 1.16 : 1.52, 16.0);
    } else {
      const distance = indoor ? 3.35 : (narrow ? 5.65 : 6.55);
      let x = position.x + Math.sin(yaw) * distance;
      let z = position.z + Math.cos(yaw) * distance;
      if (indoor) {
        x = Math.max(-hall.x + .4, Math.min(hall.x - .4, x));
        z = Math.max(hall.back + .5, Math.min(hall.front - .15, z));
      } else {
        // Shorten the camera boom when a wall or prop is directly behind the avatar.
        for (let step = .13; step <= 1; step += .13) {
          if (!world.canStand(position.x + Math.sin(yaw) * distance * step, position.z + Math.cos(yaw) * distance * step)) {
            const near = Math.max(.27, step - .13);
            x = position.x + Math.sin(yaw) * distance * near;
            z = position.z + Math.cos(yaw) * distance * near;
            break;
          }
        }
      }
      desiredCamera.set(x, indoor ? 2.53 : 3.34, z);
      target.set(position.x - Math.sin(yaw) * .9, indoor ? 1.14 : 1.52, position.z - Math.cos(yaw) * .9);
    }
    camera.position.lerp(desiredCamera, snapCamera || motion.matches ? 1 : 1 - Math.exp(-dt * 13));
    camera.lookAt(target);
    snapCamera = false;
  }

  function updateLocation() {
    const nextZone = seat?.kind === 'ride' ? 'TÀU LƯỢN'
      : indoor ? 'CHÁNH ĐIỆN'
      : position.z < -35 ? 'VƯỜN SAU · AO CÁ'
      : Math.hypot(position.x - rideStation.x, position.z - rideStation.z) < 4 ? 'GA HỒ SEN'
      : position.x < -16 && position.z > -3 ? 'KHU CỜ CARO'
      : position.z > 12.2 ? 'CỔNG CHÙA' : 'SÂN CHÙA';
    if (nextZone !== zone) {
      zone = nextZone;
      byId('place').textContent = zone;
    }
    let nearest;
    let distance = Infinity;
    if (started && !seat && !creator.open && !eventDialog.open && !roomDialog.open) {
      for (const station of world.stations) {
        if (Boolean(station.indoor) !== indoor || (escort && station.id === 'meet')) continue;
        if (station.id === 'meditate') {
          const gap = Math.min(...meditationSeats.map((spot) => Math.hypot(spot.x - position.x, spot.z - position.z)));
          if (gap <= 1.65 && gap < distance) { nearest = station; distance = gap; }
          continue;
        }
        const gap = Math.hypot(station.x - position.x, station.z - position.z);
        if (gap <= station.radius && gap < distance) {
          nearest = station;
          distance = gap;
        }
      }
    }
    if (nearest !== active) {
      active = nearest;
      interact.hidden = !nearest;
      if (nearest) interact.querySelector('span').textContent = nearest.name;
    }
  }

  function frame(now) {
    const dt = Math.min(.10, (now - lastFrame) / 1000);
    lastFrame = now;
    handleMovement(dt);
    followGuide(dt);
    const clock = online.clock();
    if (seat?.kind === 'ride') seat.progress = Math.max(seat.progress, rideProgress(seat.ride, clock));
    const progress = seat?.kind === 'ride' ? seat.progress : rideProgress(online.ride(), clock);
    expansion.animate(now, progress, fishing?.phase);
    sitOnSeat(now, clock);
    if (wasRiding && !seat) {
      wasRiding = false;
      setPlayer(rideStation.x, rideStation.z, Math.PI);
      avatar.root.position.copy(position);
    }
    if (started) {
      nearbyPose = [position.x, position.z];
      online.pose(position.x, position.z, facing, profile);
    }
    expansion.moveGuests(dt, nearbyPose);
    trackCamera(dt, now);
    updateLocation();
    updateBreath(now);
    updateFishing(now);
    updateTrainDialog(clock);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function notify(message) {
  const toast = byId('toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3800);
}

function clearMovement() {
  walkTo = undefined;
  keys.clear();
  touchKeys.clear();
  moveButtons.forEach((button) => button.classList.remove('active'));
}

function updateJournal() {
  byId('count').textContent = tasks.size + '/' + taskList.length;
  taskList.forEach((item) => item.classList.toggle('done', tasks.has(item.dataset.task)));
  const next = taskList.find((item) => !tasks.has(item.dataset.task));
  byId('guide').textContent = next ? hints[next.dataset.task] : 'Bạn đã hoàn thành một ngày an yên.';
  world.restoreActivities(tasks);
}

function complete(id) {
  if (tasks.has(id)) return;
  tasks.add(id);
  save();
  updateJournal();
  if (tasks.size === taskList.length) notify('Hoàn thành ' + taskList.length + '/' + taskList.length + ' hoạt động. Một ngày an yên!');
}

function playTone(notes) {
  if (muted || !audio || audio.state !== 'running') return;
  notes.forEach(([frequency, volume, duration], index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = audio.currentTime + index * .028;
    oscillator.type = index ? 'sine' : 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .018);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  });
}

const sound = byId('sound');
sound.addEventListener('click', async () => {
  muted = !muted;
  if (!muted) {
    try {
      audio ??= new AudioContext();
      await audio.resume();
      playTone([[440, .07, .42], [660, .032, .65]]);
    } catch {
      muted = true;
      notify('Trình duyệt chưa bật được âm thanh.');
    }
  }
  sound.setAttribute('aria-pressed', String(!muted));
  sound.title = muted ? 'Bật hiệu ứng âm thanh' : 'Tắt hiệu ứng âm thanh';
  if (muted) byId('wooden-fish').pause();
});

const musicButton = byId('music');
const backgroundMusic = byId('background-music');
backgroundMusic.volume = .38;
musicButton.addEventListener('click', async () => {
  if (!backgroundMusic.paused) {
    backgroundMusic.pause();
    return;
  }
  try { await backgroundMusic.play(); }
  catch (error) {
    if (error.name !== 'AbortError') notify('Chưa phát được nhạc nền. Hãy thử bật lại.');
  }
});
function syncMusicButton() {
  musicButton.setAttribute('aria-pressed', String(!backgroundMusic.paused));
  musicButton.title = backgroundMusic.paused ? 'Bật nhạc nền' : 'Tắt nhạc nền';
}
backgroundMusic.addEventListener('play', syncMusicButton);
backgroundMusic.addEventListener('pause', syncMusicButton);

function playWoodenFish() {
  if (muted) return;
  const sample = byId('wooden-fish');
  sample.volume = .82;
  sample.currentTime = 0;
  sample.play().catch(() => notify('Chưa phát được tiếng mõ.'));
}

function showEvent(tag, title, text, choices = []) {
  eventDialog.classList.toggle('fishing', tag === 'AO CÂU CÁ');
  byId('event-tag').textContent = tag;
  byId('event-title').textContent = title;
  byId('event-text').textContent = text;
  const list = byId('choices');
  list.replaceChildren();
  choices.forEach(([label, run]) => {
    const button = document.createElement('button');
    button.className = 'choice';
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', run);
    list.append(button);
  });
  clearMovement();
  if (!eventDialog.open) eventDialog.showModal();
}

function activity() {
  if (!active || creator.open || eventDialog.open) return;
  switch (active.id) {
    case 'meet':
      showEvent('SÂN CHÙA', 'Thích Trung Hiếu', 'Chào ' + profile.nickname + '! Bạn muốn ghé đâu trước?', [
        ['Hồ sen ở đâu?', () => {
          complete('meet');
          showEvent('SÂN CHÙA', 'Thích Trung Hiếu', 'Hồ sen nằm bên trái sân. Bạn có thể thắp đèn rồi sang mái gỗ phía đối diện để gõ mõ.');
        }],
        ['Ao câu cá ở đâu?', () => {
          complete('meet');
          if (world.stations.find((station) => station.id === 'meet').z < -38) { showEvent('AO CÂU CÁ', 'Thích Trung Hiếu', 'Đây là ao câu cá. Hãy ghé cầu gỗ để thả phao.'); return; }
          showEvent('SÂN CHÙA', 'Thích Trung Hiếu', 'Ao nằm sau chánh điện. Đi theo thầy qua lối bên phải.', [
            ['Đi theo thầy', () => { setGuide(); eventDialog.close(); }]
          ]);
        }],
        ['Mình muốn vào chánh điện.', () => {
          complete('meet');
          showEvent('SÂN CHÙA', 'Thích Trung Hiếu', 'Cứ đi thẳng qua cửa giữa. Có 100 đệm thiền hai bên lối giữa và bàn hương dưới tượng Phật ở cuối điện.');
        }]
      ]);
      break;
    case 'lotus':
      showEvent('HỒ SEN', 'Thắp đèn sen', tasks.has('lotus') ? 'Những đốm sáng đang trôi trên mặt hồ.' : 'Thắp một ánh đèn cho những điều bạn muốn giữ lại hôm nay.', [
        ['Thắp đèn', () => {
          playTone([[523, .08, .7], [784, .04, 1.1]]);
          complete('lotus');
          showEvent('HỒ SEN', 'Đèn đã sáng', 'Ánh đèn phản chiếu trên mặt hồ.');
        }]
      ]);
      break;
    case 'bell':
      showEvent('SÂN GÕ MÕ', 'Gõ mõ', 'Gõ ba tiếng để hoàn thành hoạt động. Bạn có thể gõ tiếp để nghe âm thanh.', [
        ['Gõ mõ · ' + Math.min(bellCount, 3) + '/3', (event) => {
          bellCount++;
          playWoodenFish();
          event.currentTarget.textContent = 'Gõ mõ · ' + Math.min(bellCount, 3) + '/3';
          if (bellCount >= 3) {
            complete('bell');
            byId('event-text').textContent = 'Đã hoàn thành. Bạn có thể gõ thêm hoặc quay lại sân.';
          }
        }]
      ]);
      break;
    case 'fish':
      openFishing();
      break;
    case 'meditate':
      showEvent('CHÁNH ĐIỆN', 'Ngồi thiền', 'Ngồi trên một đệm trong 12 giây. Nếu chơi chung, mỗi đệm chỉ dành cho một người.', [
        ['Ngồi vào đệm trống', () => joinSeat('meditation')]
      ]);
      break;
    case 'caro':
      showEvent('VƯỜN CỜ', 'Thích Thể Hiện', 'Độ khó vừa. Bạn cầm X và đi trước. Xếp ít nhất năm quân liền nhau theo hàng, cột hoặc đường chéo.', [
        ['Bắt đầu ván cờ', (event) => playCaro(() => complete('caro'), event)]
      ]);
      break;
    case 'coaster':
      showEvent('GA TÀU LƯỢN', 'Một vòng quanh chùa', 'Lên tàu ngay tại ga hồ sen. Tàu chạy trọn một vòng rồi đưa bạn về ga.', [
        ['Lên ghế trống', () => joinSeat('ride')]
      ]);
      updateTrainDialog(online.clock());
      break;
    case 'breath':
      showEvent('CHÁNH ĐIỆN', 'Một vòng hít thở', 'Hít vào trong 4 giây rồi thở ra trong 6 giây.', [
        ['Bắt đầu', () => {
          showEvent('CHÁNH ĐIỆN', 'Một vòng hít thở', 'Thả lỏng vai và theo nhịp hiển thị.');
          byId('breathing').hidden = false;
          breathStart = performance.now();
        }]
      ]);
      break;
    case 'incense':
      showEvent('CHÁNH ĐIỆN', 'Dâng hương', tasks.has('incense') ? 'Nén hương đang cháy trên bàn.' : 'Đặt một nén hương trên bàn trước khi rời chánh điện.', [
        ['Dâng hương', () => {
          playTone([[330, .07, .6], [495, .033, .85]]);
          complete('incense');
          showEvent('CHÁNH ĐIỆN', 'Đã dâng hương', 'Bạn có thể ghé chiếu thiền hoặc quay lại sân.');
        }]
      ]);
      break;
  }
}

function openFishing(message = 'Thả phao và chờ cá cắn. Giật cần khi thấy tín hiệu.') {
  fishing = undefined;
  showEvent('AO CÂU CÁ', 'Câu cá', message, [
    ['Thả phao', () => {
      const now = performance.now();
      fishing = { phase: 'wait', biteAt: now + 1500 + Math.random() * 2400 };
      showEvent('AO CÂU CÁ', 'Câu cá', 'Phao đang nổi. Chờ cá cắn câu…', [
        ['Giật cần', () => {
          const pulled = performance.now();
          if (fishing && pulled >= fishing.biteAt && pulled <= fishing.biteAt + 2300) {
            fishing = undefined;
            complete('fish');
            playTone([[494, .10, .42], [659, .05, .65]]);
            openFishing('Bạn đã câu được một con cá! Cá được thả lại ao.');
          } else openFishing('Cá tuột mất. Hãy đợi phao động rồi giật cần.');
        }]
      ]);
    }]
  ]);
}

function updateFishing(now) {
  if (!fishing || !eventDialog.open) return;
  if (now > fishing.biteAt + 2300) openFishing('Cá đã nhả mồi. Thử thả phao lần nữa nhé.');
  else if (now >= fishing.biteAt && fishing.phase !== 'bite') {
    fishing.phase = 'bite';
    byId('event-text').textContent = 'CÁ CẮN CÂU! Bấm Giật cần ngay.';
    playTone([[523, .12, .22]]);
  }
}

function updateTrainDialog(clock) {
  if (!eventDialog.open || byId('event-tag').textContent !== 'GA TÀU LƯỢN') return;
  const ride = online.ride();
  const underway = Boolean(ride && clock >= ride.departure);
  const button = byId('choices').firstElementChild;
  if (button) button.disabled = boardingPending || underway;
  const text = underway
    ? 'Tàu đang chạy · Về ga sau ' + Math.max(0, Math.ceil((ride.arrival - clock) / 1000)) + ' giây.'
    : ride ? 'Tàu sắp khởi hành · Bạn có thể lên ghế còn trống.'
    : 'Tàu đang đợi ở ga hồ sen. Bấm Lên ghế trống để khởi hành.';
  if (byId('event-text').textContent !== text) byId('event-text').textContent = text;
}

function stopSeat(release = true) {
  seat = undefined;
  if (release) online.release();
  activityHud.hidden = true;
  view.focus();
}
byId('activity-stop').addEventListener('click', () => {
  if (seat?.kind === 'meditation') stopSeat();
});

function updateBreath(now) {
  if (breathStart === null || !eventDialog.open) return;
  const elapsed = now - breathStart;
  if (elapsed >= 10000) {
    breathStart = null;
    byId('breathing').hidden = true;
    complete('breath');
    showEvent('CHÁNH ĐIỆN', 'Đã hoàn thành', 'Bạn đã dành trọn một vòng để hít thở.');
    return;
  }
  const inwards = elapsed < 4000;
  const seconds = Math.ceil(((inwards ? 4000 : 10000) - elapsed) / 1000);
  const text = (inwards ? 'Hít vào' : 'Thở ra') + ' · ' + seconds + 's';
  if (byId('breath-time').textContent !== text) byId('breath-time').textContent = text;
  const phase = inwards ? elapsed / 4000 : (10000 - elapsed) / 6000;
  if (!motion.matches) byId('breathing').firstElementChild.style.transform = 'scale(' + (1 + phase * .62) + ')';
}

interact.addEventListener('click', activity);
byId('close-event').addEventListener('click', () => eventDialog.close());
eventDialog.addEventListener('close', () => {
  byId('breathing').hidden = true;
  byId('breathing').firstElementChild.style.transform = '';
  breathStart = null;
  fishing = undefined;
  view.focus();
});
const movement = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
window.addEventListener('keydown', (event) => {
  if (!started || seat || creator.open || eventDialog.open || roomDialog.open) return;
  if (movement.has(event.code)) {
    keys.add(event.code);
    event.preventDefault();
  }
  if (event.code === 'KeyE' && !event.repeat) activity();
});
window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', clearMovement);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearMovement();
    if (breathStart !== null || fishing) eventDialog.close();
  }
});

moveButtons.forEach((button) => {
  button.addEventListener('pointerdown', (event) => {
    button.setPointerCapture(event.pointerId);
    touchKeys.set(event.pointerId, button.dataset.move);
    button.classList.add('active');
  });
  const release = (event) => {
    touchKeys.delete(event.pointerId);
    if (![...touchKeys.values()].includes(button.dataset.move)) button.classList.remove('active');
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
});
view.addEventListener('pointerdown', (event) => {
  if (!started || event.button !== 0 || drag) return;
  view.setPointerCapture(event.pointerId);
  drag = { id: event.pointerId, x: event.clientX, distance: 0 };
});
view.addEventListener('pointermove', (event) => {
  if (!drag || drag.id !== event.pointerId) return;
  drag.distance += Math.abs(event.clientX - drag.x);
  if (drag.distance > 7) yaw -= (event.clientX - drag.x) * .007;
  drag.x = event.clientX;
});
view.addEventListener('lostpointercapture', () => { drag = undefined; });
byId('recenter').addEventListener('click', () => { yaw = 0; view.focus(); });
