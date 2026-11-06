'use strict';

function createWorld(T, viewport) {
  const scene = new T.Scene();
  scene.background = new T.Color(0xbad0c3);
  scene.fog = new T.FogExp2(0xb8c9b9, .018);
  const camera = new T.PerspectiveCamera(49, 1, .1, 140);
  const renderer = makeRenderer(T);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  viewport.append(renderer.domElement);

  const ambient = new T.HemisphereLight(0xffeed7, 0x536b5b, 2.25);
  const sun = new T.DirectionalLight(0xffd69e, 2.15);
  sun.position.set(-14, 22, 9);
  scene.add(ambient, sun);

  const wood = 0x783b30, edge = 0x3b4f46, clay = 0x775447, gold = 0xd89953;
  const tile = 0xa49e83, base = 0x706f5b;
  const materials = new Map();
  const shapes = {
    box: new T.BoxGeometry(1, 1, 1),
    ball: new T.SphereGeometry(1, 12, 8),
    tube: new T.CylinderGeometry(.5, .5, 1, 14),
    cone: new T.CylinderGeometry(.37, .5, 1, 9),
    rock: new T.DodecahedronGeometry(1, 0)
  };
  function material(color) {
    if (!materials.has(color)) materials.set(color, new T.MeshStandardMaterial({ color, roughness: .88 }));
    return materials.get(color);
  }
  function shape(type, color, x, y, z, w, h, d, parent = scene) {
    const mesh = new T.Mesh(shapes[type], material(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    if (parent === scene && type === 'box' && y + h / 2 <= .1 && (w >= 1 || d >= 1)) mesh.userData.floor = y + h / 2;
    parent.add(mesh);
    return mesh;
  }
  const box = (...args) => shape('box', ...args);
  const ball = (...args) => shape('ball', ...args);
  const tube = (...args) => shape('tube', ...args);
  const obstacles = [];
  const block = (x, z, w, d) => obstacles.push([x - w / 2, x + w / 2, z - d / 2, z + d / 2]);
  function wall(color, x, y, z, w, h, d) {
    box(color, x, y, z, w, h, d);
    block(x, z, w, d);
  }

  function label(text, x, y, z, w, color = '#f6dfaa', parent = scene) {
    const sheet = document.createElement('canvas');
    sheet.width = 512;
    sheet.height = 96;
    const context = sheet.getContext('2d');
    context.fillStyle = '#213c38';
    context.fillRect(2, 2, 508, 92);
    context.strokeStyle = '#d8a66d';
    context.lineWidth = 4;
    context.strokeRect(4, 4, 504, 88);
    context.font = '700 36px Georgia, serif';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 256, 50, 478);
    const texture = new T.CanvasTexture(sheet);
    texture.colorSpace = T.SRGBColorSpace;
    const sprite = new T.Sprite(new T.SpriteMaterial({ map: texture, transparent: true }));
    sprite.position.set(x, y, z);
    sprite.scale.set(w, w * .188, 1);
    parent.add(sprite);
    return sprite;
  }

  function shadow(x, z, w, d, parent = scene) {
    const disk = new T.Mesh(new T.CircleGeometry(1, 18), new T.MeshBasicMaterial({
      color: 0x343b34, transparent: true, opacity: .24, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1
    }));
    disk.rotation.x = -Math.PI / 2;
    disk.position.set(x, .033, z);
    disk.scale.set(w, d, 1);
    parent.add(disk);
    return disk;
  }

  function roof(parent, x, y, z, width, depth, rise) {
    // Each slope meets a common ridge. Its curved eave rises at the corners.
    const geometry = new T.BufferGeometry();
    const positions = [];
    const palette = [new T.Color(clay), new T.Color(0x896659)];
    const colors = [];
    const row = (u, v, side) => [
      x + u * width * (.45 + .55 * v) / 2,
      y + (1 - v) ** 1.65 * rise + Math.abs(u) ** 5 * v * .38,
      z + side * v * depth / 2
    ];
    const face = (a, b, c, shade) => {
      positions.push(...a, ...b, ...c);
      for (let i = 0; i < 3; i++) colors.push(shade.r, shade.g, shade.b);
    };
    for (const side of [-1, 1]) {
      for (let i = 0; i < 20; i++) {
        const u = i / 10 - 1;
        const next = u + .1;
        for (let j = 0; j < 5; j++) {
          const v = j / 5;
          const lower = v + .2;
          const a = row(u, v, side), b = row(next, v, side);
          const c = row(next, lower, side), d = row(u, lower, side);
          const shade = palette[i % 2];
          if (side === 1) { face(a, d, b, shade); face(b, d, c, shade); }
          else { face(a, b, d, shade); face(b, c, d, shade); }
        }
      }
      const line = new T.BufferGeometry().setFromPoints(Array.from({ length: 21 }, (_, i) => new T.Vector3(...row(i / 10 - 1, 1, side))));
      parent.add(new T.Line(line, new T.LineBasicMaterial({ color: gold })));
    }
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    parent.add(new T.Mesh(geometry, new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide })));
    for (const side of [-1, 1]) {
      const cap = new T.BufferGeometry();
      const positions = [];
      for (let i = 0; i < 5; i++) {
        const v = i / 5;
        const next = v + .2;
        const a = row(side, v, -1), b = row(side, next, -1);
        const c = row(side, v, 1), d = row(side, next, 1);
        positions.push(...a, ...b, ...c, ...b, ...d, ...c);
      }
      cap.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
      cap.computeVertexNormals();
      parent.add(new T.Mesh(cap, new T.MeshStandardMaterial({ color: clay, side: T.DoubleSide })));
    }
    box(edge, x, y + rise + .07, z, width * .46, .19, .25, parent);
    for (const s of [-1, 1]) {
      ball(gold, x + s * width * .235, y + rise + .17, z, .16, .19, .16, parent);
    }
  }

  function lantern(x, y, z, parent = scene) {
    tube(gold, x, y + .35, z, .03, .32, .03, parent);
    ball(0xe88f55, x, y, z, .25, .34, .25, parent);
    for (const offset of [-.26, .26]) tube(wood, x, y + offset, z, .36, .06, .36, parent);
    tube(gold, x, y - .41, z, .05, .18, .05, parent);
  }

  box(0x6f8b68, 0, -.26, 0, 180, .50, 180).userData.terrain = true;
  box(tile, 0, -.04, 1, 26, .10, 31);
  box(0xb2a28b, 0, -.03, 14, 5.1, .10, 17);
  for (let z = -9; z <= 15; z += 1.6) {
    box(0x8e8875, 0, .016, z, 25.9, .009, .024);
    for (let x = -12; x <= 12; x += 2) box(0x8e8875, x + (Math.round(z / 1.6) % 2) * .38, .017, z + .8, .024, .008, 1.6);
  }
  for (const x of [-3.35, 3.35]) {
    wall(wood, x, 2.05, 12.2, .47, 4.1, .54);
    box(base, x, .18, 12.2, .86, .36, .87);
    lantern(x * .78, 2.68, 12.2);
  }
  box(wood, 0, 3.72, 12.2, 7.2, .35, .62);
  roof(scene, 0, 4.03, 12.2, 9.5, 3.6, 1.52);
  label('CHÙA ĐÊM', 0, 3.67, 12.64, 2.7);

  const templeRoof = new T.Group();
  scene.add(templeRoof);
  const hall = { x: 13.65, front: -7.15, back: -31.1 };
  const vermilion = 0x933e38;
  const lacquer = 0xa8493a;
  const gilt = 0xe9af54;
  box(0xcbad86, 0, -.01, -19.1, 28.6, .075, 24.8);
  box(0xa34d45, 0, .041, -18.6, 3.5, .017, 22);
  for (const x of [-1.72, 1.72]) box(gilt, x, .053, -18.6, .062, .012, 22);
  for (const x of [-13.9, 13.9]) {
    wall(0xb87853, x, 2.91, -19.1, .42, 5.82, 24.1);
    for (const z of [-8.5, -12.7, -17, -21.3, -25.6, -29.3]) {
      box(vermilion, x * .98, 2.83, z, .22, 5.65, .33);
      box(0xe1b381, x * .977, 2.53, z - 1.21, .10, 1.61, 1.46);
      lantern(x * .89, 3.35, z);
    }
  }
  wall(0x9e5c44, 0, 2.91, -31.25, 28.1, 5.82, .39);
  for (const x of [-8.05, 8.05]) {
    wall(0xb98058, x, 2.89, -7, 11.7, 5.78, .44);
    for (const offset of [-2.7, 2.7]) {
      const center = x + offset;
      box(vermilion, center, 2.4, -6.68, 3.5, 3.47, .15);
      box(0x4c5745, center, 2.51, -6.58, 3.15, 2.79, .08);
      for (let i = -3; i <= 3; i++) box(gilt, center + i * .4, 2.51, -6.52, .085, 2.82, .08);
      for (const y of [1.58, 2.42, 3.26]) box(gilt, center, y, -6.50, 3.16, .068, .09);
    }
  }
  for (const x of [-13.6, -8.05, -2.28, 2.28, 8.05, 13.6]) {
    wall(lacquer, x, 2.88, -6.26, .48, 5.76, .52);
    box(0x7c5d55, x, .21, -6.26, .78, .42, .78);
    for (const y of [.54, 4.76, 5.27]) box(gilt, x, y, -6.26, .57, .13, .58);
    lantern(x, 3.86, -5.76);
  }
  box(vermilion, 0, 5.48, -6.37, 29.3, .58, .72);
  box(gilt, 0, 5.16, -6.32, 29.6, .10, .73);
  label('ĐẠI HÙNG BẢO ĐIỆN', 0, 4.8, -5.94, 5.0);
  roof(templeRoof, 0, 5.82, -18.9, 33, 26.4, 3.9);
  roof(templeRoof, 0, 8.12, -18.9, 24, 18.5, 3.18);
  roof(templeRoof, 0, 10.16, -18.9, 13.4, 10.7, 2.08);
  const statueZ = -28.9;
  box(vermilion, 0, .34, statueZ, 7.6, .68, 3.1);
  box(gilt, 0, .71, statueZ, 7.8, .12, 3.25);
  tube(0xc48946, 0, .98, statueZ, 4.7, .52, 3.1);
  for (let i = 0; i < 14; i++) {
    const angle = i * Math.PI / 7;
    const petal = ball(0xe3a755, Math.sin(angle) * 2.02, 1.26, statueZ + Math.cos(angle) * 1.29, .48, .30, .37);
    petal.rotation.y = angle;
  }
  ball(0xdb973f, 0, 1.72, statueZ, 2.03, .61, 1.23);
  ball(gilt, 0, 2.85, statueZ - .08, 1.39, 1.61, .92);
  for (const side of [-1, 1]) {
    const arm = ball(0xf1c16c, side * .90, 2.37, statueZ + .39, .41, .75, .50);
    arm.rotation.z = side * .48;
    ball(0xf6cc7a, side * .39, 2.04, statueZ + 1.05, .54, .21, .43);
    ball(0xe6af5c, side * .72, 4.42, statueZ, .22, .44, .18);
  }
  ball(0xf0be69, 0, 4.60, statueZ, .77, .84, .66);
  ball(0x9a6035, 0, 5.13, statueZ - .12, .78, .47, .65);
  ball(0xb5773a, 0, 5.51, statueZ - .14, .34, .35, .34);
  for (const x of [-.26, .26]) box(0x71452c, x, 4.63, statueZ + .61, .26, .047, .051);
  const halo = new T.Mesh(new T.TorusGeometry(1.42, .083, 9, 44), material(0xf9ce77));
  halo.position.set(0, 4.58, statueZ - .55);
  scene.add(halo);
  wall(wood, 0, .55, -25.53, 3.55, 1.10, 1.10);
  box(gilt, 0, 1.12, -25.53, 3.69, .09, 1.19);
  tube(0x9d5d3d, 0, 1.28, -25.45, .48, .28, .48);
  block(0, statueZ, 7.6, 3.35);
  const incense = new T.Group();
  incense.visible = false;
  scene.add(incense);
  for (const x of [-.08, 0, .08]) {
    tube(0xb54434, x, 1.56, -25.45, .028, .42, .028, incense);
    ball(0xffbc72, x, 1.79, -25.45, .026, .028, .026, incense);
  }
  const meditationSeats = [];
  for (let row = 0; row < 10; row++) {
    for (let column = 0; column < 10; column++) {
      const side = column < 5 ? -1 : 1;
      const x = side * (2.8 + (side < 0 ? 4 - column : column - 5) * 1.81);
      const z = -9.25 - row * 1.58;
      meditationSeats.push({ x, z });
      box(0x8d4b4d, x, .080, z, 1.15, .085, .99);
      box(row % 2 ? 0xca8961 : 0xd4a06e, x, .134, z, .81, .05, .67);
    }
  }

  const pondX = -8, pondZ = 4;
  block(pondX, pondZ, 5.25, 4.8);
  tube(base, pondX, .15, pondZ, 5.5, .31, 5.0);
  tube(0x4c877c, pondX, .322, pondZ, 5.03, .035, 4.53);
  const pondFlowers = [];
  for (const [x, z] of [[-.95, .5], [1.1, .6], [.14, -.78]]) {
    const flower = new T.Group();
    flower.position.set(pondX + x, .4, pondZ + z);
    scene.add(flower);
    ball(0x487855, 0, 0, 0, .46, .035, .38, flower);
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      const petal = ball(0xd68c96, Math.cos(angle) * .17, .08, Math.sin(angle) * .17, .13, .08, .16, flower);
      petal.rotation.y = -angle;
    }
    const center = ball(0xc69764, 0, .15, 0, .11, .13, .11, flower);
    pondFlowers.push(center);
  }

  const bell = new T.Group();
  bell.position.set(8.1, 0, 2.55);
  scene.add(bell);
  for (const x of [-1.35, 1.35]) {
    box(wood, x, 1.32, 0, .24, 2.64, .3, bell);
    box(base, x, .13, 0, .49, .26, .48, bell);
    block(8.1 + x, 2.55, .49, .48);
  }
  roof(bell, 0, 2.63, 0, 4.1, 2.75, 1.1);
  box(wood, 0, .74, 0, 1.45, .11, .74, bell);
  box(wood, 0, .36, 0, .37, .72, .44, bell);
  ball(0xab673e, 0, 1.05, 0, .57, .36, .33, bell);
  box(0x573a32, 0, 1.025, .304, .58, .06, .066, bell);
  const mallet = tube(gold, .39, 1.30, .25, .066, .63, .066, bell);
  mallet.rotation.z = -.95;
  ball(gold, .16, 1.14, .25, .093, .086, .089, bell);
  block(8.1, 2.55, 1.48, .7);

  let seed = 119;
  function random() {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (let i = 0; i < 28; i++) {
    const x = (random() * 19 + 32) * (i % 2 ? -1 : 1);
    const z = random() * 96 - 62;
    const size = random() * 2.5 + 2.4;
    tube(0x615943, x, size * .37, z, .36, size * .76, .36);
    for (let j = 0; j < 3; j++) {
      shape('rock', [0x5b8466, 0x6e9473, 0x436c5b][j], x + (j - 1) * .68, size + j * .18, z + (j % 2) * .63, size * .43, size * .54, size * .4).rotation.y = random() * 6;
    }
  }
  for (let i = 0; i < 11; i++) {
    const x = -62 + i * 12;
    const height = 9 + random() * 11;
    shape('cone', i % 2 ? 0x78948a : 0x879a89, x, height * .28, -66 - random() * 15, 24, height, 15);
  }
  for (const x of [-12.2, 12.2]) {
    for (const z of [-4, 4.5, 10]) {
      tube(base, x, .30, z, .54, .60, .54);
      box(0xf0c887, x, .67, z, .34, .29, .34);
      shape('cone', edge, x, .88, z, .59, .21, .59);
    }
  }

  function person(profile) {
    const root = new T.Group();
    const body = new T.Group();
    root.add(body);
    scene.add(root);
    const groundShadow = shadow(0, 0, .41, .29, root);
    groundShadow.position.y = .054;
    const skin = { peach: 0xe8b89a, gold: 0xc9916a, brown: 0x905f49 }[profile.skin];
    const outfit = { jade: 0x479d88, coral: 0xcb6a5d, cream: 0xe7c48a, purple: 0x8e7ab5, npc: 0xbb824f }[profile.outfit];
    const hair = 0x372c2d;
    shape('cone', outfit, 0, .89, 0, .64, .72, .45, body);
    box(0xe4b985, 0, .72, .215, .34, .043, .045, body);
    ball(skin, 0, 1.43, 0, .286, .30, .26, body);
    ball(hair, 0, 1.574, -.06, .305, .213, .272, body);
    for (const x of [-.27, .27]) ball(skin, x, 1.435, .035, .056, .079, .07, body);
    for (const x of [-.10, .10]) ball(0x312823, x, 1.455, .243, .024, .032, .018, body);
    box(0x9d554e, 0, 1.347, .254, .066, .016, .012, body);
    if (profile.hair === 'bun') ball(hair, 0, 1.747, -.16, .14, .15, .14, body);
    if (profile.hair === 'long') ball(hair, 0, 1.34, -.154, .279, .33, .133, body);
    const limbs = [];
    for (const s of [-1, 1]) {
      const leg = new T.Group();
      leg.position.set(s * .15, .59, 0);
      shape('cone', 0x48534e, 0, -.23, 0, .18, .45, .19, leg);
      ball(0x433e36, 0, -.47, .06, .109, .077, .145, leg);
      body.add(leg);
      const arm = new T.Group();
      arm.position.set(s * .29, 1.12, 0);
      arm.rotation.z = s * .14;
      shape('cone', outfit, s * .045, -.15, 0, .18, .31, .18, arm);
      ball(skin, s * .057, -.33, 0, .072, .082, .074, arm);
      body.add(arm);
      limbs.push({ leg, arm, side: s });
    }
    return { root, body, limbs };
  }

  const npc = person({ skin: 'gold', hair: 'bun', outfit: 'npc' });
  npc.root.position.set(2.65, 0, 6.55);
  npc.root.rotation.y = -.38;

  const expansion = buildActivitiesWorld({
    T, scene, box, ball, tube, shape, material, roof, lantern, label, block, person, npc, meditationSeats, software: !renderer.isWebGLRenderer
  });
  const stations = [
    { id: 'meet', name: 'Nói chuyện với Thích Trung Hiếu', label: 'THÍCH TRUNG HIẾU', labelWidth: 2.2, x: 2.65, z: 6.55, y: 2.12, radius: 2.35 },
    { id: 'lotus', name: 'Thắp đèn sen', label: 'HỒ SEN', x: -7.5, z: 4, y: 1.37, radius: 3.03 },
    { id: 'bell', name: 'Gõ mõ', label: 'SÂN GÕ MÕ', x: 8.1, z: 2.55, y: 2.24, radius: 2.48 },
    { id: 'breath', name: 'Hít thở', label: 'HÍT THỞ', x: 0, z: -12.5, y: 1.12, radius: 1.50, indoor: true },
    { id: 'incense', name: 'Dâng hương', label: 'BÀN HƯƠNG', x: 0, z: -24.9, y: 1.69, radius: 1.76, indoor: true },
    ...expansion.stations
  ];
  stations.forEach((station) => {
    station.sign = label(station.label, station.x, station.y, station.z, station.labelWidth ?? 1.6);
  });
  expansion.guideSign = stations[0].sign;

  function resize() {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.fov = width < 620 ? 57 : 49;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function canStand(x, z) {
    if (x < -32 || x > 32 || z < -57.5 || z > 25.5) return false;
    const radius = .28;
    return obstacles.every(([left, right, top, bottom]) =>
      x + radius < left || x - radius > right || z + radius < top || z - radius > bottom);
  }

  function restoreActivities(tasks) {
    incense.visible = tasks.has('incense');
    pondFlowers.forEach((center) => {
      if (tasks.has('lotus')) {
        if (center.material === material(0xc69764)) center.material = new T.MeshStandardMaterial({ color: 0xffca79, emissive: 0xff8f32, emissiveIntensity: .72 });
      }
    });
  }

  new ResizeObserver(resize).observe(viewport);
  resize();
  return { scene, camera, renderer, templeRoof, person, stations, canStand, restoreActivities, hall, meditationSeats, expansion };
}
