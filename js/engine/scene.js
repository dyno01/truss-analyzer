/**
 * Structural Design Studio — Three.js 3D CAD & Visualization Engine
 * Renders:
 * - Repeated transverse trusses (chords, verticals, diagonals)
 * - Longitudinal purlins spanning adjacent frames
 * - Corrugated roof sheeting with dynamic canvas texture
 * - Built-up 2C laced column assemblies with base plates
 * - Longitudinal stability bracing systems (X, K, diagonal, portal)
 * - Nodal load vectors (gravity & wind)
 * - Interactive raycast picking, view framing & camera orbit
 */

(function(root) {
  'use strict';

  let scene, camera, renderer, sceneGroup, ray, mouse;
  const pickableObjects = [];
  let sceneObjects = [];

  let camDist = 22, camAngleX = 0.5, camAngleY = 0.65;
  let targetCamDist = 22;
  let target = null, displayTarget = null;
  let isDragging = false, prevX = 0, prevY = 0, lastInteraction = Date.now();

  const steelBase = new THREE.Color(0xaab4bd);

  function cylinderBetween(p1, p2, radius, color, opacity = 1) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(radius, radius, len, 12);
    const tint = new THREE.Color(color);
    const blended = steelBase.clone().lerp(tint, 0.55);
    const material = new THREE.MeshPhysicalMaterial({
      color: blended,
      roughness: 0.32,
      metalness: 0.82,
      clearcoat: 0.35,
      clearcoatRoughness: 0.25,
      emissive: tint,
      emissiveIntensity: 0.14,
      transparent: opacity < 1,
      opacity: opacity
    });
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.copy(new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function makeLabelSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 44;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(8,12,16,.86)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(111,163,192,.8)';
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
    ctx.fillStyle = '#dbe7ee';
    ctx.font = '18px monospace';
    ctx.fillText(text, 10, 29);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sprite.scale.set(1.35, 0.33, 1);
    return sprite;
  }

  const roofTextureCache = {};
  function makeRoofTexture(material) {
    if (roofTextureCache[material]) return roofTextureCache[material];
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const isAC = material === 'AC';
    const base = isAC ? '#7c8894' : '#c3cad1';
    const stripe = isAC ? '#5f6b76' : '#eef2f5';

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = stripe;
    ctx.lineWidth = isAC ? 7 : 4;
    const step = isAC ? 16 : 10;
    for (let x = -size; x < size * 2; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    roofTextureCache[material] = tex;
    return tex;
  }

  function buildColumnAssembly(x, heightM, z, spacing_s_mm = 60) {
    const group = [];
    const chWidth = 0.18, chDepth = 0.09;
    const gap = Math.max(0.04, (spacing_s_mm || 60) / 1000);
    const colMat = new THREE.MeshPhysicalMaterial({ color: 0x8a97a4, roughness: 0.4, metalness: 0.7, clearcoat: 0.2 });

    [-1, 1].forEach((side) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(chWidth, heightM, chDepth), colMat);
      mesh.position.set(x + side * (gap / 2 + chWidth / 2), heightM / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.push(mesh);
    });

    const laceMat = new THREE.MeshPhysicalMaterial({ color: 0x6f7d89, roughness: 0.5, metalness: 0.6 });
    const panelH = 1.2;
    const nPanels = Math.max(1, Math.round(heightM / panelH));
    const realH = heightM / nPanels;
    const xL = x - gap / 2, xR = x + gap / 2;

    for (let p = 0; p < nPanels; p++) {
      const y0 = p * realH, y1 = (p + 1) * realH;
      [[xL, y0, xR, y1], [xR, y0, xL, y1]].forEach(([x1, yA, x2, yB]) => {
        const a = new THREE.Vector3(x1, yA, z);
        const b = new THREE.Vector3(x2, yB, z);
        const mesh = cylinderBetween(a, b, 0.025, 0x6f7d89);
        mesh.material = laceMat;
        group.push(mesh);
      });
    }

    const plate = new THREE.Mesh(new THREE.BoxGeometry(chWidth * 2 + gap + 0.1, 0.04, chDepth + 0.1), laceMat);
    plate.position.set(x, 0.02, z);
    group.push(plate);
    return group;
  }

  function addColumnLongitudinals(vt, S) {
    const count = root.frameCount();
    const L = Math.max(Number(S.length) || 0, Number(S.spacing) || 1);
    if (count < 2) return [];
    const out = [];
    const levels = [Math.max(0.25, (Number(S.height) || 0) * 0.55), Math.max(0.25, (Number(S.height) || 0) - 0.05)];
    const nodes = [vt.pin, vt.roller];
    const dz = L / (count - 1);

    levels.forEach((y, li) => {
      nodes.forEach((ni, si) => {
        const n = vt.nodes[ni];
        for (let f = 0; f < count - 1; f++) {
          const beam = cylinderBetween(
            new THREE.Vector3(n.x, y, f * dz),
            new THREE.Vector3(n.x, y, (f + 1) * dz),
            0.045,
            0x788894
          );
          beam.userData = { kind: li === 1 ? 'eaves_strut' : 'side_rail', level: li, side: si, frame: f };
          out.push(beam);
        }
      });
    });
    return out;
  }

  function addSupports(vt, z) {
    const S = root.S;
    const pin = vt.nodes[vt.pin], rol = vt.nodes[vt.roller];
    const baseGeo = new THREE.ConeGeometry(0.42, 0.6, 3);
    const pinMat = new THREE.MeshPhysicalMaterial({ color: 0xe8a33d, roughness: 0.4, metalness: 0.6, clearcoat: 0.3 });
    const rolMat = new THREE.MeshPhysicalMaterial({ color: 0x8a97a4, roughness: 0.35, metalness: 0.7, clearcoat: 0.3 });

    const add = (o, ud) => {
      o.userData = ud || { kind: 'support' };
      scene.add(o);
      sceneObjects.push(o);
      pickableObjects.push(o);
    };

    [pin, rol].forEach((n, idx) => {
      const m = new THREE.Mesh(baseGeo, idx ? rolMat : pinMat);
      m.rotation.y = Math.PI;
      m.position.set(n.x, n.y - 0.36, z);
      add(m, { kind: 'support', frame: Math.round(z / (Math.max(1, S.length / (root.frameCount() - 1)))) });

      const hatch = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.5), new THREE.MeshStandardMaterial({ color: 0x2a3540, roughness: 0.7 }));
      hatch.position.set(n.x, n.y - 0.66, z);
      add(hatch);

      if (idx) {
        [-0.18, 0.18].forEach((off) => {
          const r = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 10), rolMat);
          r.rotation.z = Math.PI / 2;
          r.position.set(n.x, n.y - 0.68, z + off);
          add(r);
        });
      }
    });
  }

  function addNodes(vt, z, frame) {
    const S = root.S;
    const discGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.05, 6);
    const boltGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.09, 8);
    const discMat = new THREE.MeshPhysicalMaterial({ color: 0x2c3742, roughness: 0.5, metalness: 0.6, clearcoat: 0.2 });
    const boltMat = new THREE.MeshPhysicalMaterial({ color: 0xd8dee3, roughness: 0.25, metalness: 0.85, clearcoat: 0.5 });

    vt.nodes.forEach((n, i) => {
      const d = new THREE.Mesh(discGeo, discMat);
      d.rotation.x = Math.PI / 2;
      d.position.set(n.x, n.y, z);
      d.userData = { kind: 'node', frame, index: i };
      scene.add(d);
      sceneObjects.push(d);
      pickableObjects.push(d);

      const bolt = new THREE.Mesh(boltGeo, boltMat);
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(n.x, n.y, z + 0.03);
      bolt.userData = { kind: 'node', frame, index: i };
      scene.add(bolt);
      sceneObjects.push(bolt);
      pickableObjects.push(bolt);

      if (S.layers.labels && frame === 0) {
        const lab = makeLabelSprite(vt.names[i]);
        lab.position.set(n.x, n.y + 0.42, z);
        scene.add(lab);
        sceneObjects.push(lab);
      }
    });
  }

  function addPurlinsAndRoof(vt, S) {
    const group = [];
    const L = Math.max(Number(S.length) || 0, Number(S.spacing) || 1);
    const topCount = (Number(S.panels) || 0) + 1;
    const top = vt.nodes.slice(topCount);
    if (top.length < 2) return group;

    const sorted = [...top].sort((a, b) => a.x - b.x);
    const overhang = Math.max(0, Number(S.overhang) || 0);
    const xLeft = sorted[0].x - overhang;
    const xRight = sorted[sorted.length - 1].x + overhang;

    if (S.layers.purlins) {
      const count = root.frameCount();
      const dz = count > 1 ? L / (count - 1) : L;
      const pRadius = 0.035;

      sorted.forEach((n, i) => {
        const y = n.y + 0.08;
        for (let f = 0; f < count - 1; f++) {
          const z0 = f * dz, z1 = (f + 1) * dz;
          const mesh = cylinderBetween(
            new THREE.Vector3(n.x, y, z0),
            new THREE.Vector3(n.x, y, z1),
            pRadius,
            0x5b7a91
          );
          mesh.userData = { kind: 'purlin', x: n.x, frame: f };
          group.push(mesh);
        }
        if (i === 0 && overhang > 0) {
          const mesh = cylinderBetween(
            new THREE.Vector3(n.x, y, -overhang),
            new THREE.Vector3(n.x, y, 0),
            pRadius,
            0x5b7a91
          );
          mesh.userData = { kind: 'purlin', x: n.x, frame: 0, overhang: true };
          group.push(mesh);
        }
        if (i === sorted.length - 1 && overhang > 0) {
          const mesh = cylinderBetween(
            new THREE.Vector3(n.x, y, L),
            new THREE.Vector3(n.x, y, L + overhang),
            pRadius,
            0x5b7a91
          );
          mesh.userData = { kind: 'purlin', x: n.x, frame: count - 1, overhang: true };
          group.push(mesh);
        }
      });
    }

    if (S.layers.roof) {
      const shape = new THREE.Shape();
      const first = sorted[0], last = sorted[sorted.length - 1];
      shape.moveTo(xLeft, first.y + 0.13);
      for (let i = 1; i < sorted.length; i++) shape.lineTo(sorted[i].x, sorted[i].y + 0.13);
      shape.lineTo(xRight, last.y + 0.13);
      shape.lineTo(xRight, last.y + 0.10);
      for (let i = sorted.length - 1; i >= 0; i--) shape.lineTo(sorted[i].x, sorted[i].y + 0.10);
      shape.lineTo(xLeft, first.y + 0.10);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, { depth: L, bevelEnabled: false, curveSegments: 1 });
      const tex = makeRoofTexture(S.roof);
      const tc = tex.clone();
      tc.needsUpdate = true;
      tc.repeat.set(Math.max(1, (xRight - xLeft) / 1.5), Math.max(1, L / 1.5));
      const mat = new THREE.MeshPhysicalMaterial({
        map: tc,
        color: 0xffffff,
        roughness: 0.6,
        metalness: 0.15,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const roof = new THREE.Mesh(geo, mat);
      roof.castShadow = true;
      roof.receiveShadow = true;
      roof.userData = { kind: 'roof' };
      group.push(roof);
    }
    return group;
  }

  function clearScene() {
    sceneObjects.forEach((o) => {
      if (o.parent) o.parent.remove(o);
    });
    sceneObjects = [];
    pickableObjects.length = 0;
    if (sceneGroup) sceneGroup.clear();
  }

  function updateCamera() {
    if (controls) {
      controls.update();
      return;
    }
    camera.position.x = displayTarget.x + camDist * Math.sin(camAngleY) * Math.cos(camAngleX);
    camera.position.z = displayTarget.z + camDist * Math.cos(camAngleY) * Math.cos(camAngleX);
    camera.position.y = displayTarget.y + camDist * Math.sin(camAngleX);
    camera.lookAt(displayTarget);
  }

  function fitCamera(view = (root.S && root.S.view) || '3d') {
    const S = root.S;
    const box = new THREE.Box3();
    sceneObjects.forEach((o) => {
      if (!o || !o.visible) return;
      if (o.userData && (o.userData.kind === 'ground' || o.userData.kind === 'grid')) return;
      box.expandByObject(o);
    });
    if (box.isEmpty()) {
      box.set(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Number(S.span) || 16, Number(S.height) || 11, Number(S.length) || 54)
      );
    }
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    target.copy(center);
    displayTarget.copy(center);

    const maxDim = Math.max(size.x, size.y, size.z, 10);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const aspect = Math.max(camera.aspect || 1, 0.5);
    const dist = Math.max(
      (maxDim * 0.5) / Math.tan(fov * 0.5),
      (maxDim * 0.5) / (aspect * Math.tan(fov * 0.5)),
      12
    ) * 1.32;

    targetCamDist = dist;
    camDist = dist;

    if (view === 'front') {
      camAngleX = 0.05; camAngleY = 0;
      if (controls) {
        controls.target.copy(center);
        camera.position.set(center.x, center.y, center.z + dist);
      }
    } else if (view === 'side') {
      camAngleX = 0.05; camAngleY = Math.PI / 2;
      if (controls) {
        controls.target.copy(center);
        camera.position.set(center.x + dist, center.y, center.z);
      }
    } else if (view === 'plan') {
      camAngleX = 1.48; camAngleY = 0;
      if (controls) {
        controls.target.copy(center);
        camera.position.set(center.x, center.y + dist, center.z + 0.001);
      }
    } else if (view === 'iso') {
      camAngleX = 0.61; camAngleY = Math.PI / 4;
      if (controls) {
        controls.target.copy(center);
        camera.position.set(center.x + dist * 0.72, center.y + dist * 0.58, center.z + dist * 0.72);
      }
    } else {
      // 3d elevated perspective
      camAngleX = 0.45; camAngleY = 0.65;
      if (controls) {
        controls.target.copy(center);
        camera.position.set(center.x + dist * 0.6, center.y + dist * 0.48, center.z + dist * 0.65);
      }
    }

    if (controls) {
      controls.target.copy(center);
      controls.update();
    }
    lastInteraction = Date.now();
    updateCamera();
  }

  function addStabilityMember(parent, a, b, r = 0.055) {
    const m = cylinderBetween(a, b, r, 0xd32f2f);
    m.userData = { kind: 'bracing' };
    parent.add(m);
  }

  function buildLongitudinalStability() {
    const S = root.S;
    const old = scene.getObjectByName('longitudinal-stability');
    if (old) {
      old.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      scene.remove(old);
    }
    const sys = S.stabilitySystem || 'not_specified';
    if (sys === 'not_specified' || !S.layers.bracing || root.frameCount() < 2) return;

    const g = new THREE.Group();
    g.name = 'longitudinal-stability';
    const L = Math.max(Number(S.length) || 0, Number(S.spacing) || 1);
    const count = root.frameCount();
    const totalBays = Math.max(1, count - 1);
    const bay = L / totalBays;

    // IS 800:2007 Cl. 4.3 Longitudinal Stability:
    // Determine calculated braced bays:
    // - Both gable end bays (Bay 0 and Bay totalBays - 1) are required to transfer longitudinal gable wind drag to foundations.
    // - For sheds with totalBays >= 5 (or length >= 30m), an intermediate expansion bay is also braced to limit unbraced length <= 30m.
    const bracedBays = [];
    if (totalBays === 1) {
      bracedBays.push(0);
    } else if (totalBays <= 4) {
      bracedBays.push(0, totalBays - 1);
    } else {
      const midBay = Math.floor(totalBays / 2);
      bracedBays.push(0, midBay, totalBays - 1);
    }

    const span = Number(S.span) || 16, height = Math.max(0.1, Number(S.height) || 11), slope = Number(S.slope) || 10;
    const rise = (span * Math.tan((slope * Math.PI) / 180)) / 2;
    const yBase = 0.15, yEave = Math.max(0.25, height - 0.05), yApex = height + rise;
    const xL = 0, xR = span, xC = span / 2;

    const addWallSingle = (x, z0, z1, zm, bIdx) => {
      if (sys === 'single_diagonal') {
        addStabilityMember(g, new THREE.Vector3(x, yBase, z0), new THREE.Vector3(x, yEave, z1));
      } else if (sys === 'x_bracing') {
        addStabilityMember(g, new THREE.Vector3(x, yBase, z0), new THREE.Vector3(x, yEave, z1));
        addStabilityMember(g, new THREE.Vector3(x, yEave, z0), new THREE.Vector3(x, yBase, z1));
      } else if (sys === 'k_bracing') {
        addStabilityMember(g, new THREE.Vector3(x, yBase, z0), new THREE.Vector3(x, yEave * 0.52, zm));
        addStabilityMember(g, new THREE.Vector3(x, yEave, z0), new THREE.Vector3(x, yEave * 0.52, zm));
        addStabilityMember(g, new THREE.Vector3(x, yBase, z1), new THREE.Vector3(x, yEave * 0.52, zm));
        addStabilityMember(g, new THREE.Vector3(x, yEave, z1), new THREE.Vector3(x, yEave * 0.52, zm));
      } else if (sys === 'portalised_bay') {
        addStabilityMember(g, new THREE.Vector3(x, yBase, z0), new THREE.Vector3(x, yEave, z0), 0.08);
        addStabilityMember(g, new THREE.Vector3(x, yBase, z1), new THREE.Vector3(x, yEave, z1), 0.08);
      }
    };

    const addRoofSlope = (side, z0, z1, zm, bIdx) => {
      const xe = side === 'left' ? xL : xR;
      const p0e = new THREE.Vector3(xe, yEave, z0), p1e = new THREE.Vector3(xe, yEave, z1);
      const p0c = new THREE.Vector3(xC, yApex, z0), p1c = new THREE.Vector3(xC, yApex, z1);
      if (sys === 'single_diagonal') {
        addStabilityMember(g, p0e, p1c);
      } else if (sys === 'x_bracing') {
        addStabilityMember(g, p0e, p1c);
        addStabilityMember(g, p0c, p1e);
      } else if (sys === 'k_bracing') {
        const mid = new THREE.Vector3(xC, yEave + (yApex - yEave) * 0.5, zm);
        addStabilityMember(g, p0e, mid);
        addStabilityMember(g, p0c, mid);
        addStabilityMember(g, p1e, mid);
        addStabilityMember(g, p1c, mid);
      } else if (sys === 'portalised_bay') {
        addStabilityMember(g, p0e, p0c, 0.08);
        addStabilityMember(g, p1e, p1c, 0.08);
      }
    };

    bracedBays.forEach((bIdx) => {
      const z0 = bIdx * bay;
      const z1 = (bIdx + 1) * bay;
      const zm = (z0 + z1) / 2;

      addWallSingle(xL, z0, z1, zm, bIdx);
      addWallSingle(xR, z0, z1, zm, bIdx);
      addRoofSlope('left', z0, z1, zm, bIdx);
      addRoofSlope('right', z0, z1, zm, bIdx);
    });

    g.traverse((o) => {
      if (o.isMesh) {
        o.userData = Object.assign({}, o.userData || {}, { kind: 'bracing', stabilitySystem: sys });
        pickableObjects.push(o);
      }
    });
    scene.add(g);
  }

  function buildScene() {
    clearScene();
    const S = root.S;
    const vt = root.v6Truss();
    const count = root.frameCount();
    const L = Math.max(Number(S.length) || 0, Number(S.spacing) || 1);

    for (let f = 0; f < count; f++) {
      const z = count === 1 ? 0 : (f * L) / (count - 1);
      if (S.layers.frames) {
        vt.members.forEach((q, i) => {
          const a = vt.nodes[q.a], bb = vt.nodes[q.b];
          const isChord = q.type.includes('chord');
          const o = cylinderBetween(
            new THREE.Vector3(a.x, a.y, z),
            new THREE.Vector3(bb.x, bb.y, z),
            0.045,
            isChord ? 0x70b8dc : 0x79a9bd
          );
          o.userData = { kind: 'member', frame: f, index: i, role: q.type };
          scene.add(o);
          sceneObjects.push(o);
          pickableObjects.push(o);
        });
        addNodes(vt, z, f);
      }

      if (S.layers.columns) {
        [vt.pin, vt.roller].forEach((ni, si) => {
          const n = vt.nodes[ni];
          buildColumnAssembly(n.x, Number(S.height) || 0, z, 56).forEach((o) => {
            const isLacing = o.material && o.material.color && o.material.color.getHex() === 0x6f7d89;
            o.userData = { kind: isLacing ? 'lacing' : 'column', frame: f, side: si };
            scene.add(o);
            sceneObjects.push(o);
            pickableObjects.push(o);
          });
        });
        addSupports(vt, z);
      }
    }

    if (S.layers.columns) {
      addColumnLongitudinals(vt, S).forEach((o) => {
        scene.add(o);
        sceneObjects.push(o);
        pickableObjects.push(o);
      });
    }

    addPurlinsAndRoof(vt, S).forEach((o) => {
      scene.add(o);
      sceneObjects.push(o);
      pickableObjects.push(o);
    });

    if (S.layers.loads) {
      const topY = Math.max(...vt.nodes.map((n) => n.y));
      // Gravity arrow (downward red)
      const gravArrow = cylinderBetween(
        new THREE.Vector3(vt.span / 2, topY + 1.2, L / 2),
        new THREE.Vector3(vt.span / 2, topY + 0.15, L / 2),
        0.06,
        0xe06c61
      );
      gravArrow.scale.set(1.5, 1.5, 1.5);
      gravArrow.userData = { kind: 'load', type: 'gravity' };
      scene.add(gravArrow);
      sceneObjects.push(gravArrow);
      pickableObjects.push(gravArrow);
    }

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.max(120, L * 2), Math.max(120, L * 2)),
      new THREE.MeshStandardMaterial({ color: 0x0c1017, roughness: 0.55, metalness: 0.15 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(vt.span / 2, 0, L / 2);
    ground.visible = S.layers.grid;
    scene.add(ground);
    sceneObjects.push(ground);

    const gh = new THREE.GridHelper(Math.max(120, L * 2), 80, 0x22303a, 0x161c22);
    gh.position.set(vt.span / 2, 0.01, L / 2);
    gh.visible = S.layers.grid;
    scene.add(gh);
    sceneObjects.push(gh);

    buildLongitudinalStability();
    fitCamera();
  }

  let controls = null;
  let selectionHighlightGroup = null;
  let hudMode = 'orbit'; // 'orbit' or 'pan'
  let autoRotateEnabled = true;

  function resizeRenderer() {
    const wrap = document.querySelector('.scene');
    if (!wrap || !renderer || !camera) return;
    const r = wrap.getBoundingClientRect();
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height));
    camera.aspect = Math.max(1, r.width) / Math.max(1, r.height);
    camera.updateProjectionMatrix();
  }

  function updateSelectionHighlight() {
    if (!scene) return;
    if (!selectionHighlightGroup) {
      selectionHighlightGroup = new THREE.Group();
      scene.add(selectionHighlightGroup);
    }
    selectionHighlightGroup.clear();

    const sel = root.S && root.S.selected;
    if (!sel) return;

    const targets = pickableObjects.filter((o) => {
      const u = o.userData;
      if (!u) return false;
      if (sel.kind === 'member' && u.kind === 'member') {
        return u.index === sel.index && (sel.frame === undefined || u.frame === sel.frame);
      }
      if (sel.kind === 'column' && u.kind === 'column') {
        return u.side === sel.side && (sel.frame === undefined || u.frame === sel.frame);
      }
      if (sel.kind === 'purlin' && u.kind === 'purlin') {
        return u.purlinIndex === sel.purlinIndex;
      }
      if (sel.kind === 'bracing' && u.kind === 'bracing') {
        return u.bay === sel.bay;
      }
      if (sel.kind === 'node' && u.kind === 'node') {
        return u.index === sel.index;
      }
      return false;
    });

    targets.forEach((obj) => {
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const sx = Math.max(size.x + 0.16, 0.28);
      const sy = Math.max(size.y + 0.16, 0.28);
      const sz = Math.max(size.z + 0.16, 0.28);

      const boxGeo = new THREE.BoxGeometry(sx, sy, sz);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0xffd166,
        wireframe: true,
        transparent: true,
        opacity: 0.95
      });
      const wireMesh = new THREE.Mesh(boxGeo, wireMat);
      wireMesh.position.copy(center);
      selectionHighlightGroup.add(wireMesh);

      const auraMat = new THREE.MeshBasicMaterial({
        color: 0xff9f1c,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide
      });
      const auraMesh = new THREE.Mesh(boxGeo.clone(), auraMat);
      auraMesh.position.copy(center);
      selectionHighlightGroup.add(auraMesh);
    });
  }

  function focusSelection(userData = root.S && root.S.selected) {
    if (!userData) {
      fitCamera();
      return;
    }
    const found = pickableObjects.find((o) => {
      const u = o.userData;
      if (!u) return false;
      if (userData.kind === 'member' && u.kind === 'member') {
        return u.index === userData.index && (userData.frame === undefined || u.frame === userData.frame);
      }
      if (userData.kind === 'column' && u.kind === 'column') {
        return u.side === userData.side && (userData.frame === undefined || u.frame === userData.frame);
      }
      if (userData.kind === 'purlin' && u.kind === 'purlin') {
        return u.purlinIndex === userData.purlinIndex;
      }
      if (userData.kind === 'bracing' && u.kind === 'bracing') {
        return u.bay === userData.bay;
      }
      return false;
    });

    if (found) {
      const box = new THREE.Box3().setFromObject(found);
      const c = box.getCenter(new THREE.Vector3());
      const sz = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(sz.x, sz.y, sz.z, 2);

      target.copy(c);
      displayTarget.copy(c);
      targetCamDist = Math.max(maxDim * 2.2, 5.5);

      if (controls) {
        controls.target.copy(c);
        const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
        if (dir.lengthSq() < 0.001) dir.set(0.6, 0.5, 0.65).normalize();
        camera.position.copy(c).addScaledVector(dir, targetCamDist);
        controls.update();
      }
      lastInteraction = Date.now();
      updateCamera();
      updateSelectionHighlight();
    } else {
      fitCamera();
    }
  }

  function panCamera(dx, dy) {
    const scale = (controls ? camera.position.distanceTo(controls.target) : camDist) * 0.0016;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();
    const panOffset = new THREE.Vector3()
      .addScaledVector(right, -dx * scale)
      .addScaledVector(up, dy * scale);

    target.add(panOffset);
    displayTarget.add(panOffset);
    if (controls) {
      controls.target.add(panOffset);
      camera.position.add(panOffset);
      controls.update();
    }
    lastInteraction = Date.now();
    updateCamera();
  }

  function orbitCamera(dPitch, dYaw) {
    lastInteraction = Date.now();
    if (controls) {
      const eye = new THREE.Vector3().subVectors(camera.position, controls.target);
      const radius = eye.length();
      const theta = Math.atan2(eye.x, eye.z) + dYaw;
      let phi = Math.acos(Math.max(-1, Math.min(1, eye.y / radius))) - dPitch;
      phi = Math.max(0.08, Math.min(Math.PI * 0.49, phi));
      camera.position.set(
        controls.target.x + radius * Math.sin(phi) * Math.sin(theta),
        controls.target.y + radius * Math.cos(phi),
        controls.target.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      controls.update();
    } else {
      camAngleY += dYaw;
      camAngleX = Math.max(0.05, Math.min(1.45, camAngleX + dPitch));
      updateCamera();
    }
  }

  function zoomCamera(factor) {
    lastInteraction = Date.now();
    if (controls) {
      if (factor < 1) controls.dollyIn(1 / factor);
      else controls.dollyOut(factor);
      controls.update();
    } else {
      targetCamDist = Math.max(5, Math.min(220, targetCamDist * factor));
      camDist = targetCamDist;
      updateCamera();
    }
  }

  function pickObject(e) {
    if (!renderer || !renderer.domElement || !camera) return;
    const r = renderer.domElement.getBoundingClientRect();
    const cx = e.clientX, cy = e.clientY;

    // Direct raycast
    mouse.x = ((cx - r.left) / r.width) * 2 - 1;
    mouse.y = -((cy - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(mouse, camera);
    let hit = ray.intersectObjects(pickableObjects, false)[0];

    // Surrounding touch tolerance for mobile fingertips & small screens
    if (!hit) {
      const isTouch = e.pointerType === 'touch' || window.innerWidth < 780;
      const step = isTouch ? 14 : 7;
      const offsets = [
        [-step, 0], [step, 0], [0, -step], [0, step],
        [-step, -step], [step, step], [-step, step], [step, -step],
        [-step * 1.5, 0], [step * 1.5, 0], [0, -step * 1.5], [0, step * 1.5]
      ];
      for (let i = 0; i < offsets.length; i++) {
        const testX = ((cx + offsets[i][0] - r.left) / r.width) * 2 - 1;
        const testY = -((cy + offsets[i][1] - r.top) / r.height) * 2 + 1;
        ray.setFromCamera(new THREE.Vector2(testX, testY), camera);
        const nearHit = ray.intersectObjects(pickableObjects, false)[0];
        if (nearHit) {
          hit = nearHit;
          break;
        }
      }
    }

    root.S.selected = hit ? hit.object.userData : null;
    updateSelectionHighlight();
    if (root.refreshInspector) root.refreshInspector();
  }

  function animateLoop() {
    requestAnimationFrame(animateLoop);
    const now = Date.now();

    if (controls) {
      // Gentle auto-rotation only when idle in 3D / ISO views
      const isIdle = !isDragging && (now - lastInteraction > 4500);
      controls.autoRotate = autoRotateEnabled && isIdle && (root.S.view === '3d' || root.S.view === 'iso');
      controls.autoRotateSpeed = 0.75;
      controls.update();
    } else {
      if (autoRotateEnabled && root.S.view === '3d' && !isDragging && now - lastInteraction > 4500) {
        camAngleY += 0.002;
      }
      camDist += (targetCamDist - camDist) * 0.06;
      displayTarget.lerp(target, 0.06);
      updateCamera();
    }

    // Animate selection highlight pulse if active
    if (selectionHighlightGroup && selectionHighlightGroup.children.length > 0) {
      const pulse = 0.75 + 0.25 * Math.sin(now * 0.005);
      selectionHighlightGroup.children.forEach((c) => {
        if (c.material) c.material.opacity = c.material.wireframe ? pulse : pulse * 0.25;
      });
    }

    renderer.render(scene, camera);
  }

  function initScene() {
    const wrap = document.querySelector('.scene');
    if (!wrap) return;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x10141a, 0.010);
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 2000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.touchAction = 'none';
    wrap.appendChild(renderer.domElement);

    sceneGroup = new THREE.Group();
    scene.add(sceneGroup);
    ray = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    target = new THREE.Vector3(6, 4, 0);
    displayTarget = new THREE.Vector3(6, 4, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const key = new THREE.DirectionalLight(0xfff4e0, 1.15); key.position.set(24, 34, 26); scene.add(key);
    const fill = new THREE.DirectionalLight(0x6fa3c0, 0.45); fill.position.set(-22, 14, -18); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xe8a33d, 0.35); rim.position.set(-6, 8, -30); scene.add(rim);
    scene.add(new THREE.HemisphereLight(0x2a3540, 0x0a0e12, 0.4));

    // Initialize OrbitControls for pure native 1-finger orbit, 2-finger pinch & pan
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = 0.85;
      controls.zoomSpeed = 1.15;
      controls.panSpeed = 0.95;
      controls.screenSpacePanning = true;
      controls.minDistance = 2.5;
      controls.maxDistance = 250;
      controls.maxPolarAngle = Math.PI * 0.49;
      controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
      controls.addEventListener('start', () => {
        isDragging = true;
        lastInteraction = Date.now();
      });
      controls.addEventListener('end', () => {
        isDragging = false;
        lastInteraction = Date.now();
      });
    }

    // Tap vs Drag detection: ensures touches only select on clean tap
    let tapStartX = 0, tapStartY = 0, tapStartTime = 0;

    renderer.domElement.addEventListener('pointerdown', (e) => {
      tapStartX = e.clientX;
      tapStartY = e.clientY;
      tapStartTime = Date.now();
      lastInteraction = Date.now();
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    });

    window.addEventListener('pointerup', (e) => {
      isDragging = false;
      lastInteraction = Date.now();
      const dist = Math.hypot(e.clientX - tapStartX, e.clientY - tapStartY);
      const dur = Date.now() - tapStartTime;
      // Clean tap (finger or mouse clicked without dragging/orbiting)
      if (dist < 8 && dur < 400) {
        pickObject(e);
      }
    });

    const fitBtn = document.getElementById('btnFitModel');
    if (fitBtn) fitBtn.onclick = () => fitCamera();

    // Keyboard Shortcuts (Arrow keys for orbit, Shift+Arrows for pan, +/- for zoom, F for fit)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowUp') {
        if (e.shiftKey) panCamera(0, -25);
        else orbitCamera(0.06, 0);
      } else if (e.key === 'ArrowDown') {
        if (e.shiftKey) panCamera(0, 25);
        else orbitCamera(-0.06, 0);
      } else if (e.key === 'ArrowLeft') {
        if (e.shiftKey) panCamera(25, 0);
        else orbitCamera(0, 0.07);
      } else if (e.key === 'ArrowRight') {
        if (e.shiftKey) panCamera(-25, 0);
        else orbitCamera(0, -0.07);
      } else if (e.key === '+' || e.key === '=') {
        zoomCamera(0.9);
      } else if (e.key === '-' || e.key === '_') {
        zoomCamera(1.1);
      } else if (e.key.toLowerCase() === 'f') {
        fitCamera();
      }
    });

    window.addEventListener('resize', resizeRenderer);
    resizeRenderer();
    animateLoop();
  }

  const SceneModule = {
    initScene,
    buildScene,
    buildLongitudinalStability,
    fitCamera,
    focusSelection,
    updateSelectionHighlight,
    orbitCamera,
    panCamera,
    zoomCamera,
    resizeRenderer
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SceneModule;
  } else {
    root.SceneModule = SceneModule;
    root.build = buildScene;
    root.fit = fitCamera;
    root.focusSelection = focusSelection;
    root.updateSelectionHighlight = updateSelectionHighlight;
    root.resize = resizeRenderer;
    root.buildLongitudinalStability = buildLongitudinalStability;
  }
})(typeof window !== 'undefined' ? window : global);
