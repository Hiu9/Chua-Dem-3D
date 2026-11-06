'use strict';

function makeRenderer(T) {
  const canvas = document.createElement('canvas');
  const options = { antialias: true };
  const context = canvas.getContext('webgl2', options) || canvas.getContext('webgl', options);
  if (context) return new T.WebGLRenderer({ canvas, context, ...options });
  return makeCanvasRenderer(T);
}

// Draw the same perspective scene on devices where WebGL is unavailable.
function makeCanvasRenderer(T) {
  const canvas = document.createElement('canvas');
  const pen = canvas.getContext('2d');
  const geometryCache = new WeakMap();
  const vector = new T.Vector3();
  const normal = new T.Vector3();
  const worldNormal = new T.Matrix3();
  const sun = new T.Vector3(-.45, .8, .35).normalize();
  const modelView = new T.Matrix4();
  const workingColor = new T.Color();
  const styles = new Map();
  let w = 1, h = 1, focal = 1, near = .14, last = -Infinity;

  function geometry(mesh) {
    const source = mesh.geometry;
    if (geometryCache.has(source)) return geometryCache.get(source);
    const position = source.getAttribute('position');
    const color = source.getAttribute('color');
    const index = source.index;
    const faces = [];
    const points = [];
    const ids = [];
    const unique = new Map();
    for (let i = 0; i < position.count; i++) {
      const point = [position.getX(i), position.getY(i), position.getZ(i)];
      const key = point.map((value) => value.toFixed(5)).join(',');
      if (!unique.has(key)) {
        unique.set(key, points.length);
        points.push(point);
      }
      ids.push(unique.get(key));
    }
    const count = index ? index.count : position.count;
    for (let i = 0; i < count; i += 3) {
      const ai = index ? index.getX(i) : i;
      const bi = index ? index.getX(i + 1) : i + 1;
      const ci = index ? index.getX(i + 2) : i + 2;
      const a = ids[ai], b = ids[bi], c = ids[ci];
      if (a === b || a === c || b === c) continue;
      const p = new T.Vector3(...points[a]);
      const norm = new T.Vector3(...points[b]).sub(p).cross(new T.Vector3(...points[c]).sub(p)).normalize();
      faces.push({ a, b, c, norm, color: color ? new T.Color(color.getX(ai), color.getY(ai), color.getZ(ai)) : null });
    }
    const result = { points, faces, size: source.boundingSphere?.radius ?? 1 };
    geometryCache.set(source, result);
    return result;
  }

  function clip(points) {
    const result = [];
    let previous = points[points.length - 1];
    for (const next of points) {
      if ((next[2] >= near) !== (previous[2] >= near)) {
        const weight = (near - previous[2]) / (next[2] - previous[2]);
        result.push([previous[0] + (next[0] - previous[0]) * weight, previous[1] + (next[1] - previous[1]) * weight, near]);
      }
      if (next[2] >= near) result.push(next);
      previous = next;
    }
    return result;
  }

  function projection([x, y, depth]) {
    return [w / 2 + x * focal / depth, h / 2 - y * focal / depth];
  }

  function drawSky(camera) {
    const sky = pen.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#6f9aa3');
    sky.addColorStop(.64, '#d0c8ae');
    sky.addColorStop(1, '#f5d3aa');
    pen.fillStyle = sky;
    pen.fillRect(0, 0, w, h);
    const horizon = Math.max(0, Math.min(h, h / 2 - Math.tan(-camera.rotation.x) * focal));
    const ground = pen.createLinearGradient(0, horizon, 0, h || 1);
    ground.addColorStop(0, '#b9c7aa');
    ground.addColorStop(1, '#79916c');
    pen.fillStyle = ground;
    pen.fillRect(0, horizon, w, h - horizon);
  }

  function render(scene, camera) {
    const time = performance.now();
    if (time - last < 31) return;
    last = time;
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    focal = h * .5 / Math.tan(camera.fov * Math.PI / 360);
    near = camera.near;
    drawSky(camera);
    const draw = [];
    scene.traverseVisible((object) => {
      if (object.userData.terrain) return;
      if (object.isSprite) {
        vector.setFromMatrixPosition(object.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
        if (vector.z >= -near) return;
        const depth = -vector.z;
        const [x, y] = projection([vector.x, vector.y, depth]);
        const sw = object.scale.x * focal / depth, sh = object.scale.y * focal / depth;
        draw.push({ depth, image: object.material.map.image, x: x - sw / 2, y: y - sh / 2, sw, sh });
        return;
      }
      if (!object.isMesh) return;
      modelView.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld);
      vector.setFromMatrixPosition(modelView);
      const depth = -vector.z;
      const cached = geometry(object);
      const radius = Math.max(object.scale.x, object.scale.y, object.scale.z) * cached.size;
      if (depth + radius <= near || depth - radius > 95) return;
      if (Math.abs(vector.x) > Math.max(0, depth) * w / (2 * focal) + radius * 2.2) return;
      if (object.geometry.type === 'SphereGeometry' && depth > 35 && radius < .3) return;
      const points = cached.points.map((point) => {
        vector.set(...point).applyMatrix4(modelView);
        return [vector.x, vector.y, -vector.z];
      });
      worldNormal.getNormalMatrix(object.matrixWorld);
      const color = object.material.color;
      for (const face of cached.faces) {
        const a = points[face.a], b = points[face.b], c = points[face.c];
        if (a[2] < near && b[2] < near && c[2] < near) continue;
        const clipped = a[2] >= near && b[2] >= near && c[2] >= near ? [a, b, c] : clip([a, b, c]);
        if (clipped.length < 3) continue;
        const projected = clipped.map(projection);
        const [p, q, r] = projected;
        const area = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
        if (Math.abs(area) < .7 || (area > 0 && object.material.side !== T.DoubleSide)) continue;
        normal.copy(face.norm).applyMatrix3(worldNormal).normalize();
        if (area > 0) normal.negate();
        const light = .67 + Math.max(0, normal.dot(sun)) * .39 + Math.max(0, normal.y) * .10;
        const z = (a[2] + b[2] + c[2]) / 3;
        const lightStep = Math.round(light * 24);
        const fogStep = Math.round(Math.min(.79, (z * .014) ** 2) * 20);
        const baseColor = face.color || color;
        let palette = styles.get(baseColor);
        if (!palette) styles.set(baseColor, palette = new Map());
        const key = lightStep * 32 + fogStep;
        let fill = palette.get(key);
        if (!fill) {
          fill = workingColor.copy(baseColor).multiplyScalar(lightStep / 24)
            .lerp(scene.fog.color, fogStep / 20).getStyle();
          palette.set(key, fill);
        }
        draw.push({ depth: object.userData.floor === undefined ? z : 120 - object.userData.floor * 50, projected, color: fill, alpha: object.material.opacity });
      }
    });
    draw.sort((a, b) => b.depth - a.depth);
    pen.lineJoin = 'round';
    pen.lineWidth = .55;
    for (const face of draw) {
      if (face.image) {
        pen.globalAlpha = 1;
        pen.drawImage(face.image, face.x, face.y, face.sw, face.sh);
        continue;
      }
      pen.globalAlpha = face.alpha;
      pen.beginPath();
      face.projected.forEach(([x, y], i) => i ? pen.lineTo(x, y) : pen.moveTo(x, y));
      pen.closePath();
      pen.fillStyle = face.color;
      pen.fill();
      if (face.alpha === 1) {
        pen.strokeStyle = face.color;
        pen.stroke();
      }
    }
    pen.globalAlpha = 1;
  }
  return {
    domElement: canvas,
    setPixelRatio() {},
    setSize(width, height) {
      const scale = Math.min(1, 880 / width);
      w = canvas.width = Math.max(1, Math.round(width * scale));
      h = canvas.height = Math.max(1, Math.round(height * scale));
    },
    render
  };
}
