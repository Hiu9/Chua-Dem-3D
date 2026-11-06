'use strict';

const guideRoute = [[4.4, 7.1], [19.7, 7.1], [19.7, -32.8], [12.8, -37.1], [8.2, -39.9]];

function buildActivitiesWorld({ T, scene, box, ball, tube, shape, material, roof, lantern, label, block, person, npc, meditationSeats, software }) {
  const wood = 0x70453b, tile = 0xc4a47d, rails = 0x533a36, gold = 0xc78448;
  const pond = { x: 0, z: -46.3, rx: 10.1, rz: 6.15 };
  box(tile, 19.7, .02, -12, 3.5, .08, 43);
  box(tile, 14.9, .02, 7.1, 12.9, .08, 2.6);
  box(tile, 14, .02, -35.7, 14, .08, 3.15);
  box(tile, 5.5, .02, -38.6, 15.5, .08, 3.5);
  tube(0x706b60, pond.x, .15, pond.z, 21, .35, 13);
  const water = tube(0x519b91, pond.x, .345, pond.z, 20.1, .045, 12.25);
  water.material = new T.MeshStandardMaterial({ color: 0x509c92, roughness: .42, metalness: .04 });
  for (let i = 0; i < 22; i++) {
    const a = i / 22 * Math.PI * 2;
    box(0x898272, Math.sin(a) * 10.35, .31, pond.z + Math.cos(a) * 6.3, .74, .33, .71).rotation.y = a;
  }
  // Blocking strips follow the oval without preventing access to its banks.
  for (let z = -6; z <= 6; z += .5) {
    const width = 20.6 * Math.sqrt(Math.max(0, 1 - (z / 6.4) ** 2));
    block(0, pond.z + z, width, .53);
  }
  box(wood, 7.0, .20, -41, 3.5, .18, 2.1);
  for (const x of [5.48, 8.52]) tube(wood, x, .48, -40.0, .21, .85, .21);
  lantern(10.05, 1.79, -39.2);
  tube(wood, 10.05, 1.1, -39.2, .18, 2.2, .18);
  const fish = [];
  for (let i = 0; i < 9; i++) {
    const root = new T.Group();
    const color = [0xdd7857, 0xe6b86f, 0xeee3ca, 0xc75d50][i % 4];
    scene.add(root);
    ball(color, 0, 0, 0, .18, .085, .35, root);
    ball(0xf1d8b2, 0, .041, .035, .13, .053, .10, root);
    const tail = shape('cone', color, 0, 0, -.36, .29, .09, .28, root);
    tail.rotation.x = Math.PI / 2;
    fish.push({ root, tail });
  }
  const bobber = new T.Group();
  bobber.visible = false;
  scene.add(bobber);
  tube(0xc74643, 0, .05, 0, .12, .18, .12, bobber);
  ball(0xffefd4, 0, .12, 0, .062, .065, .062, bobber);

  box(tile, -19.2, .025, 4.1, 11.5, .075, 8.3);
  for (const x of [-22.7, -17.5]) {
    for (const z of [1.7, 6.45]) {
      tube(wood, x, 1.37, z, .31, 2.74, .31);
      block(x, z, .35, .35);
    }
  }
  roof(scene, -20.1, 2.69, 4.05, 7.6, 6.9, 1.5);
  box(wood, -20.1, .57, 4.0, 1.8, 1.12, 1.28);
  box(0xd6a96c, -20.1, 1.14, 4.0, 1.64, .061, 1.15);
  for (let i = -6; i <= 6; i++) {
    box(wood, -20.1 + i * .083, 1.175, 4.0, .012, .013, 1.0);
    box(wood, -20.1, 1.175, 4.0 + i * .083, 1.0, .013, .012);
  }
  block(-20.1, 4.0, 1.8, 1.28);
  const chessNpc = person({ skin: 'brown', hair: 'short', outfit: 'purple' });
  chessNpc.root.position.set(-20.1, 0, 2.9);

  const track = new T.CatmullRomCurve3([
    [-15.2, 1.65, 4.3], [-17.3, 2.1, -2.7], [-23.5, 6.9, -13],
    [-27, 4.3, -30], [-20.5, 9.8, -45], [-3, 6.4, -55],
    [19, 10.0, -49], [27.5, 5.6, -29], [27, 7.7, -8],
    [25.8, 3.8, 13], [16, 5.3, 23], [0, 4.15, 24.8],
    [-13.6, 3.15, 20.5], [-16.3, 1.75, 11.7], [-15.6, 1.65, 8.5]
  ].map((point) => new T.Vector3(...point)), true);
  track.arcLengthDivisions = 650;
  const sample = (t) => track.getPointAt(((t % 1) + 1) % 1);
  const spacing = 1.12 / track.getLength();
  function link(a, b, color, width, height) {
    const mid = a.clone().lerp(b, .5);
    const mesh = box(color, mid.x, mid.y, mid.z, width, height, a.distanceTo(b) + .09);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), b.clone().sub(a).normalize());
  }
  function offset(t, distance) {
    const base = sample(t);
    const next = sample(t + .001).sub(base);
    const len = Math.hypot(next.x, next.z);
    return base.add(new T.Vector3(-next.z / len * distance, 0, next.x / len * distance));
  }
  const segments = 104;
  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const next = (i + 1) / segments;
    for (const side of [-.49, .49]) link(offset(t, side), offset(next, side), rails, .10, .12);
    if (i % 2 === 0) link(offset(t, -.66), offset(t, .66), gold, .115, .097);
    if (i % 6 === 0) {
      const post = sample(t);
      tube(0x79645b, post.x, post.y / 2, post.z, .20, post.y, .20);
    }
  }
  box(tile, rideStation.x, .032, rideStation.z, 3.35, .10, 7.35);
  for (const z of [3.35, 8.0]) {
    tube(wood, -12.25, .99, z, .19, 1.98, .19);
    lantern(-12.25, 1.89, z);
  }
  box(wood, -13.7, .26, 8.7, 1.15, .44, .30);
  const train = [];
  for (let row = 0; row < 5; row++) {
    const car = new T.Group();
    scene.add(car);
    box(row % 2 ? 0x41867a : 0xaf5944, 0, .22, 0, 1.35, .39, .95, car);
    for (const side of [-1, 1]) {
      const x = side * .35;
      box(wood, x, .49, -.29, .46, .52, .11, car);
      box(0xe4a15f, x, .48, .05, .46, .11, .58, car);
      tube(rails, x, .02, .29, .24, .16, .24, car);
    }
    train.push(car);
  }
  let previousProgress = -1;
  function trainAt(progress) {
    if (progress === previousProgress) return;
    previousProgress = progress;
    const t = progress * progress * (3 - 2 * progress);
    train.forEach((car, row) => {
      const p = t - row * spacing;
      car.position.copy(sample(p));
      const next = sample(p + .001).sub(car.position);
      car.rotation.y = Math.atan2(next.x, next.z);
      car.rotation.x = -Math.atan2(next.y, Math.hypot(next.x, next.z));
      car.updateMatrixWorld(true);
    });
  }
  function rideSeat(index) {
    const car = train[Math.floor(index / 2)];
    return { position: car.localToWorld(new T.Vector3(index % 2 ? .35 : -.35, .52, 0)), facing: car.rotation.y };
  }
  function animate(now, progress, fishing) {
    fish.forEach(({ root, tail }, i) => {
      const a = now * (.00044 + i * .000027) + i * 2.08;
      const rx = 4.8 + i % 3 * 1.34, rz = 2.25 + i % 4 * .6;
      root.position.set(Math.sin(a) * rx, .405 + Math.sin(a * 4) * .017, pond.z + Math.cos(a) * rz);
      root.rotation.y = Math.atan2(Math.cos(a) * rx, -Math.sin(a) * rz);
      tail.rotation.z = Math.sin(now * .01 + i) * .37;
    });
    bobber.visible = Boolean(fishing);
    if (fishing) bobber.position.set(6.1, .44 + Math.sin(now * (fishing === 'bite' ? .024 : .004)) * (fishing === 'bite' ? .15 : .041), -43.8);
    trainAt(progress);
  }

  const guests = new Map();
  const outfits = [0x479d88, 0xcb6a5d, 0xe7c48a, 0x8e7ab5];
  function discardSign(guest) {
    if (!guest.sign) return;
    guest.root.remove(guest.sign);
    guest.sign.material.map.dispose();
    guest.sign.material.dispose();
    guest.sign = undefined;
  }
  function setGuests(players) {
    const seen = new Set();
    for (const [id, x, z, angle, outfit, name, claim] of players) {
      seen.add(id);
      let guest = guests.get(id);
      if (!guest) {
        const root = new T.Group();
        root.position.set(x, 0, z);
        scene.add(root);
        const torso = shape('cone', outfits[outfit] ?? outfits[0], 0, .73, 0, .59, .71, .44, root);
        ball(0xdcb395, 0, 1.22, 0, .24, .25, .24, root);
        ball(0x413336, 0, 1.36, -.036, .248, .147, .231, root);
        box(0x394742, 0, .205, 0, .28, .40, .23, root);
        guest = { root, torso, name: '', target: new T.Vector3() };
        guests.set(id, guest);
      }
      if (guest.name !== name) {
        discardSign(guest);
        guest.name = name;
      }
      guest.torso.material = material(outfits[outfit] ?? outfits[0]);
      guest.target.set(x, 0, z);
      guest.angle = angle;
      guest.claim = claim;
    }
    for (const [id, guest] of guests) {
      if (seen.has(id)) continue;
      discardSign(guest);
      scene.remove(guest.root);
      guests.delete(id);
    }
  }
  function moveGuests(dt, nearby) {
    const ordered = [];
    for (const guest of guests.values()) {
      const { root, target, claim } = guest;
      const [kind, index] = (claim || '').split(':');
      if (kind === 'ride' && train[Math.floor(Number(index) / 2)]) {
        const seat = rideSeat(Number(index));
        root.position.copy(seat.position);
        root.rotation.y = seat.facing;
        root.scale.y = .73;
      } else if (kind === 'meditation' && meditationSeats[Number(index)]) {
        const spot = meditationSeats[Number(index)];
        root.position.set(spot.x, 0, spot.z);
        root.rotation.y = Math.PI;
        root.scale.y = .63;
      } else {
        if (root.position.y > .4) root.position.copy(target);
        else root.position.lerp(target, Math.min(1, dt * 12));
        root.rotation.y = guest.angle;
        root.scale.y = 1;
      }
      const distance = nearby ? Math.hypot(root.position.x - nearby[0], root.position.z - nearby[1]) : Infinity;
      ordered.push({ guest, distance });
    }
    ordered.sort((a, b) => a.distance - b.distance);
    ordered.forEach(({ guest, distance }, index) => {
      guest.root.visible = distance < 66 && (!software || index < 24);
      const showSign = index < 14 && distance < 17;
      if (showSign && !guest.sign) guest.sign = label(guest.name, 0, 1.8, 0, 1.6, '#f6dfaa', guest.root);
      if (guest.sign) guest.sign.visible = showSign;
    });
  }

  return {
    npc, animate, rideSeat, setGuests, moveGuests,
    stations: [
      { id: 'fish', name: 'Câu cá', label: 'AO CÂU CÁ', x: 7.35, z: -40.18, y: 1.59, radius: 2.75 },
      { id: 'caro', name: 'Chơi caro với Thích Thể Hiện', label: 'THÍCH THỂ HIỆN · CARO', labelWidth: 3.15, x: -20.1, z: 4.65, y: 2.16, radius: 2.85 },
      { id: 'coaster', name: 'Lên tàu lượn', label: 'GA TÀU LƯỢN · 10 CHỖ', labelWidth: 3.3, x: rideStation.x, z: rideStation.z, y: 2.72, radius: rideStation.radius },
      { id: 'meditate', name: 'Ngồi thiền', label: 'KHU THIỀN · 100 CHỖ', labelWidth: 3.4, x: 4, z: -12, y: 1.6, radius: 3.0, indoor: true }
    ]
  };
}
