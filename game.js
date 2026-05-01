import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

/*
  LITTLE BEAR LOST - Better Prototype
  Controls:
  WASD / Arrow Keys = move
  Shift = run
  Hold Right Click + move mouse = rotate camera
  Mouse Wheel = zoom
  E = inspect clue
*/

// =====================================================
// UI
// =====================================================
const objectiveEl = document.getElementById("objective");
const storyEl = document.getElementById("storyText");
const helpEl = document.getElementById("help");

function setObjective(text) {
  if (objectiveEl) objectiveEl.textContent = "Objective: " + text;
}

function setStory(text) {
  if (storyEl) storyEl.textContent = text;
}

if (helpEl) {
  helpEl.textContent =
    "WASD / Arrow Keys = Move • Shift = Run • Hold Right Click = Camera • E = Inspect";
}

// =====================================================
// BASIC SETUP
// =====================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color("#17281f");
scene.fog = new THREE.FogExp2("#17281f", 0.018);

const camera = new THREE.PerspectiveCamera(
  58,
  window.innerWidth / window.innerHeight,
  0.1,
  600
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

document.body.appendChild(renderer.domElement);
renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());

// =====================================================
// COLORS / MATERIALS
// =====================================================
const MAT = {
  grass: new THREE.MeshStandardMaterial({ color: "#375f36", roughness: 1 }),
  grassDark: new THREE.MeshStandardMaterial({ color: "#284a2d", roughness: 1 }),
  grassLight: new THREE.MeshStandardMaterial({ color: "#547a41", roughness: 1 }),
  dirt: new THREE.MeshStandardMaterial({ color: "#5a3f2a", roughness: 1 }),
  trunk: new THREE.MeshStandardMaterial({ color: "#4f301d", roughness: 1 }),
  trunkDark: new THREE.MeshStandardMaterial({ color: "#392114", roughness: 1 }),
  leaves1: new THREE.MeshStandardMaterial({ color: "#245f39", roughness: 1 }),
  leaves2: new THREE.MeshStandardMaterial({ color: "#347846", roughness: 1 }),
  leaves3: new THREE.MeshStandardMaterial({ color: "#426f37", roughness: 1 }),
  rock: new THREE.MeshStandardMaterial({ color: "#626a62", roughness: 1 }),
  rockDark: new THREE.MeshStandardMaterial({ color: "#484f49", roughness: 1 }),
  glowGold: new THREE.MeshStandardMaterial({
    color: "#ffe68a",
    emissive: "#ffe68a",
    emissiveIntensity: 2.3,
    roughness: 0.35
  }),
  glowBlue: new THREE.MeshStandardMaterial({
    color: "#8edcff",
    emissive: "#8edcff",
    emissiveIntensity: 2.4,
    roughness: 0.35
  }),
  glowOrange: new THREE.MeshStandardMaterial({
    color: "#ffb07c",
    emissive: "#ff915d",
    emissiveIntensity: 2.4,
    roughness: 0.35
  })
};

// =====================================================
// LIGHTING
// =====================================================
const hemi = new THREE.HemisphereLight("#cfe7ff", "#253721", 1.25);
scene.add(hemi);

const sun = new THREE.DirectionalLight("#ffe6b0", 2.65);
sun.position.set(-35, 45, 24);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 150;
sun.shadow.camera.left = -70;
sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70;
sun.shadow.camera.bottom = -70;
scene.add(sun);

const blueFill = new THREE.DirectionalLight("#9abaff", 0.55);
blueFill.position.set(30, 18, -25);
scene.add(blueFill);

const denGlow = new THREE.PointLight("#ffdf9a", 1.1, 18);
denGlow.position.set(-2, 3, -2);
scene.add(denGlow);

// =====================================================
// MATH HELPERS
// =====================================================
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerpAngle(a, b, t) {
  const diff = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + diff * t;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function heightAt(x, z) {
  let h = 0;
  h += Math.sin(x * 0.045) * 1.2;
  h += Math.cos(z * 0.05) * 1.0;
  h += Math.sin((x + z) * 0.032) * 0.9;
  h += Math.cos((x - z) * 0.025) * 0.55;

  const denDist = Math.hypot(x, z);
  h -= Math.max(0, 6 - denDist) * 0.12;

  return h;
}

function isNearPath(x, z) {
  const protectedSpots = [
    { x: 0, z: 0, r: 12 },
    { x: 4, z: 5, r: 6 },
    { x: -7, z: 18, r: 6 },
    { x: 6, z: 35, r: 7 }
  ];

  for (const p of protectedSpots) {
    if (Math.hypot(x - p.x, z - p.z) < p.r) return true;
  }

  return false;
}

// =====================================================
// TERRAIN
// =====================================================
const terrainGeo = new THREE.PlaneGeometry(260, 260, 150, 150);
const terrainPos = terrainGeo.attributes.position;

for (let i = 0; i < terrainPos.count; i++) {
  const x = terrainPos.getX(i);
  const z = terrainPos.getY(i);
  terrainPos.setZ(i, heightAt(x, z));
}

terrainGeo.computeVertexNormals();

const terrain = new THREE.Mesh(terrainGeo, MAT.grass);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
scene.add(terrain);

// Dirt path / den clearing patches
function addGroundPatch(x, z, radius, mat, yOffset = 0.035) {
  const patch = new THREE.Mesh(new THREE.CircleGeometry(radius, 28), mat);
  patch.rotation.x = -Math.PI / 2;
  patch.position.set(x, heightAt(x, z) + yOffset, z);
  patch.receiveShadow = true;
  scene.add(patch);
  return patch;
}

addGroundPatch(0, 0, 7.2, MAT.dirt);
addGroundPatch(3, 8, 3.2, MAT.grassLight);
addGroundPatch(-4, 17, 3.5, MAT.dirt);
addGroundPatch(5, 35, 5.5, MAT.dirt);

for (let i = 0; i < 85; i++) {
  const x = rand(-118, 118);
  const z = rand(-118, 118);
  const mat = Math.random() > 0.5 ? MAT.grassLight : MAT.grassDark;
  addGroundPatch(x, z, rand(1.0, 3.3), mat, 0.025);
}

// =====================================================
// INSTANCED GRASS
// =====================================================
const grassBladeGeo = new THREE.ConeGeometry(0.035, 0.65, 3);
grassBladeGeo.translate(0, 0.325, 0);

const grassBladeMat = new THREE.MeshStandardMaterial({
  color: "#6d8c4e",
  roughness: 1,
  side: THREE.DoubleSide
});

const grassCount = 2600;
const grassMesh = new THREE.InstancedMesh(grassBladeGeo, grassBladeMat, grassCount);
grassMesh.castShadow = true;
grassMesh.receiveShadow = true;
scene.add(grassMesh);

const dummy = new THREE.Object3D();

for (let i = 0; i < grassCount; i++) {
  let x = rand(-125, 125);
  let z = rand(-125, 125);

  if (isNearPath(x, z) && Math.random() < 0.65) {
    x += rand(5, 15) * (Math.random() > 0.5 ? 1 : -1);
  }

  const y = heightAt(x, z);
  dummy.position.set(x, y + 0.03, z);
  dummy.rotation.set(rand(-0.16, 0.16), rand(0, Math.PI * 2), rand(-0.18, 0.18));
  const s = rand(0.55, 1.55);
  dummy.scale.set(s, rand(0.8, 1.6), s);
  dummy.updateMatrix();
  grassMesh.setMatrixAt(i, dummy.matrix);
}

grassMesh.instanceMatrix.needsUpdate = true;

// =====================================================
// WORLD OBJECTS
// =====================================================
function addRock(x, z, scale = 1) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.9 * scale, 0),
    Math.random() > 0.45 ? MAT.rock : MAT.rockDark
  );

  rock.position.set(x, heightAt(x, z) + 0.48 * scale, z);
  rock.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
  rock.scale.set(rand(0.9, 1.45), rand(0.55, 0.95), rand(0.85, 1.4));
  rock.castShadow = true;
  rock.receiveShadow = true;
  scene.add(rock);
  return rock;
}

function addBush(x, z, scale = 1) {
  const g = new THREE.Group();

  for (let i = 0; i < 4; i++) {
    const part = new THREE.Mesh(
      new THREE.SphereGeometry(rand(0.45, 0.75) * scale, 16, 12),
      Math.random() > 0.5 ? MAT.leaves2 : MAT.leaves3
    );

    part.position.set(
      rand(-0.55, 0.55) * scale,
      heightAt(x, z) + rand(0.35, 0.8) * scale,
      rand(-0.45, 0.45) * scale
    );

    part.scale.y = rand(0.65, 0.95);
    part.castShadow = true;
    part.receiveShadow = true;
    g.add(part);
  }

  g.position.set(x, 0, z);
  scene.add(g);
  return g;
}

function addTree(x, z, scale = 1) {
  const g = new THREE.Group();
  const baseY = heightAt(x, z);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22 * scale, 0.38 * scale, 5.0 * scale, 10),
    Math.random() > 0.4 ? MAT.trunk : MAT.trunkDark
  );

  trunk.position.y = baseY + 2.45 * scale;
  trunk.rotation.z = rand(-0.04, 0.04);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  g.add(trunk);

  const leafMat = [MAT.leaves1, MAT.leaves2, MAT.leaves3][Math.floor(Math.random() * 3)];

  const leaf1 = new THREE.Mesh(
    new THREE.ConeGeometry(1.9 * scale, 3.8 * scale, 14),
    leafMat
  );
  leaf1.position.y = baseY + 5.15 * scale;
  leaf1.castShadow = true;
  g.add(leaf1);

  const leaf2 = new THREE.Mesh(
    new THREE.ConeGeometry(1.55 * scale, 3.2 * scale, 14),
    leafMat
  );
  leaf2.position.y = baseY + 6.7 * scale;
  leaf2.castShadow = true;
  g.add(leaf2);

  const leaf3 = new THREE.Mesh(
    new THREE.ConeGeometry(1.1 * scale, 2.4 * scale, 14),
    leafMat
  );
  leaf3.position.y = baseY + 8.0 * scale;
  leaf3.castShadow = true;
  g.add(leaf3);

  g.position.set(x, 0, z);
  scene.add(g);
  return g;
}

function addFallenLog(x, z, rot = 0, scale = 1) {
  const log = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45 * scale, 0.58 * scale, 6.2 * scale, 14),
    MAT.trunk
  );

  log.rotation.z = Math.PI / 2;
  log.rotation.y = rot;
  log.position.set(x, heightAt(x, z) + 0.7 * scale, z);
  log.castShadow = true;
  log.receiveShadow = true;
  scene.add(log);

  const cut1 = new THREE.Mesh(
    new THREE.CircleGeometry(0.47 * scale, 14),
    new THREE.MeshStandardMaterial({ color: "#b28455", roughness: 1 })
  );
  cut1.position.set(x + Math.cos(rot) * 3.1 * scale, heightAt(x, z) + 0.7 * scale, z - Math.sin(rot) * 3.1 * scale);
  cut1.rotation.y = Math.PI / 2 - rot;
  scene.add(cut1);

  return log;
}

// Forest scatter
for (let i = 0; i < 210; i++) {
  const x = rand(-122, 122);
  const z = rand(-122, 122);
  if (isNearPath(x, z)) continue;
  addTree(x, z, rand(0.75, 1.55));
}

for (let i = 0; i < 90; i++) {
  const x = rand(-115, 115);
  const z = rand(-115, 115);
  if (isNearPath(x, z)) continue;
  addRock(x, z, rand(0.45, 1.25));
}

for (let i = 0; i < 120; i++) {
  const x = rand(-120, 120);
  const z = rand(-120, 120);
  if (isNearPath(x, z)) continue;
  addBush(x, z, rand(0.55, 1.25));
}

// Den area
addRock(-3.3, -2.3, 1.4);
addRock(2.8, -2.2, 1.0);
addRock(-0.8, -4.2, 0.85);
addFallenLog(-1.5, -1.5, 0.35, 1.05);
addFallenLog(2.2, 1.5, -0.8, 0.75);

// =====================================================
// BABY BEAR MODEL
// =====================================================
function makeMat(color, roughness = 0.95) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

function createBabyBear() {
  const root = new THREE.Group();
  const model = new THREE.Group();
  root.add(model);

  const fur = makeMat("#765032");
  const furLight = makeMat("#9a6a45");
  const furDark = makeMat("#4b2e1e");
  const muzzleMat = makeMat("#c49461");
  const blackMat = makeMat("#101010", 0.65);
  const clawMat = makeMat("#211713", 0.8);

  function sphere(name, radius, mat, pos, scale = [1, 1, 1]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 20), mat);
    m.name = name;
    m.position.set(pos[0], pos[1], pos[2]);
    m.scale.set(scale[0], scale[1], scale[2]);
    m.castShadow = true;
    m.receiveShadow = true;
    model.add(m);
    return m;
  }

  const torso = sphere("torso", 0.86, fur, [0, 0.95, 0], [1.18, 0.82, 1.65]);
  const chest = sphere("chest", 0.62, furLight, [0, 1.08, 0.86], [1.18, 0.92, 1.0]);
  const rump = sphere("rump", 0.62, furDark, [0, 0.86, -0.95], [1.12, 0.86, 1.05]);
  const belly = sphere("belly", 0.47, muzzleMat, [0, 0.78, 0.48], [1.15, 0.65, 0.75]);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.55, 14), furLight);
  neck.position.set(0, 1.28, 1.34);
  neck.rotation.x = -0.55;
  neck.castShadow = true;
  neck.receiveShadow = true;
  model.add(neck);

  const head = sphere("head", 0.57, furLight, [0, 1.55, 1.75], [1.03, 0.98, 1.03]);
  const snout = sphere("snout", 0.255, muzzleMat, [0, 1.43, 2.21], [1.08, 0.72, 1.22]);

  const nose = sphere("nose", 0.085, blackMat, [0, 1.49, 2.47], [1.2, 0.75, 0.9]);
  nose.castShadow = false;

  const leftEye = sphere("leftEye", 0.055, blackMat, [-0.17, 1.62, 2.16], [1, 1, 1]);
  const rightEye = sphere("rightEye", 0.055, blackMat, [0.17, 1.62, 2.16], [1, 1, 1]);
  leftEye.castShadow = false;
  rightEye.castShadow = false;

  const eyeShineMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
  const leftShine = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), eyeShineMat);
  leftShine.position.set(-0.155, 1.638, 2.205);
  model.add(leftShine);

  const rightShine = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), eyeShineMat);
  rightShine.position.set(0.185, 1.638, 2.205);
  model.add(rightShine);

  const earGeo = new THREE.SphereGeometry(0.19, 20, 14);
  const leftEar = new THREE.Mesh(earGeo, furDark);
  leftEar.position.set(-0.34, 1.96, 1.58);
  leftEar.scale.set(1, 1.05, 0.85);
  leftEar.castShadow = true;
  model.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, furDark);
  rightEar.position.set(0.34, 1.96, 1.58);
  rightEar.scale.set(1, 1.05, 0.85);
  rightEar.castShadow = true;
  model.add(rightEar);

  const tail = sphere("tail", 0.15, furDark, [0, 0.96, -1.55], [1, 1, 1]);

  function createLeg(name, x, z, front) {
    const leg = new THREE.Group();
    leg.name = name;
    leg.position.set(x, 0.88, z);
    model.add(leg);

    const upper = new THREE.Group();
    leg.add(upper);

    const upperMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.58, 14), furDark);
    upperMesh.position.y = -0.28;
    upperMesh.castShadow = true;
    upperMesh.receiveShadow = true;
    upper.add(upperMesh);

    const lower = new THREE.Group();
    lower.position.y = -0.52;
    upper.add(lower);

    const lowerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.46, 14), furDark);
    lowerMesh.position.y = -0.22;
    lowerMesh.castShadow = true;
    lowerMesh.receiveShadow = true;
    lower.add(lowerMesh);

    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 12), furDark);
    paw.scale.set(1.1, 0.58, 1.45);
    paw.position.set(0, -0.48, front ? 0.09 : -0.03);
    paw.castShadow = true;
    paw.receiveShadow = true;
    lower.add(paw);

    for (let i = -1; i <= 1; i++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.085, 8), clawMat);
      claw.rotation.x = Math.PI / 2;
      claw.position.set(i * 0.055, -0.49, front ? 0.25 : 0.12);
      lower.add(claw);
    }

    return { leg, upper, lower, paw };
  }

  const frontLeft = createLeg("frontLeft", -0.42, 0.86, true);
  const frontRight = createLeg("frontRight", 0.42, 0.86, true);
  const backLeft = createLeg("backLeft", -0.42, -0.67, false);
  const backRight = createLeg("backRight", 0.42, -0.67, false);

  // Tiny shadow blob under bear
  const shadowBlob = new THREE.Mesh(
    new THREE.CircleGeometry(1.0, 30),
    new THREE.MeshBasicMaterial({
      color: "#000000",
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    })
  );
  shadowBlob.rotation.x = -Math.PI / 2;
  root.add(shadowBlob);

  return {
    root,
    model,
    torso,
    chest,
    rump,
    head,
    snout,
    leftEar,
    rightEar,
    frontLeft,
    frontRight,
    backLeft,
    backRight,
    shadowBlob,
    walkCycle: 0
  };
}

const bearRig = createBabyBear();
const bear = bearRig.root;
bear.position.set(0, heightAt(0, 0), 0);
bear.rotation.y = Math.PI;
scene.add(bear);

// =====================================================
// CLUES / STORY PROPS
// =====================================================
function makeGlowClue(name, x, z, mat, color) {
  const g = new THREE.Group();
  const baseY = heightAt(x, z);

  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16), mat);
  orb.position.y = baseY + 1.05;
  g.add(orb);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.045, 8, 36),
    new THREE.MeshBasicMaterial({ color })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = baseY + 0.18;
  g.add(ring);

  const light = new THREE.PointLight(color, 3.2, 12);
  light.position.y = baseY + 1.3;
  g.add(light);

  g.position.set(x, 0, z);
  g.userData = { name, x, z, baseY, orb, ring, light };
  scene.add(g);
  return g;
}

const clues = [
  makeGlowClue("claw marks", 4, 5, MAT.glowGold, "#ffe68a"),
  makeGlowClue("torn net", -7, 18, MAT.glowBlue, "#8edcff"),
  makeGlowClue("tire tracks", 6, 35, MAT.glowOrange, "#ffb07c")
];

// Visual clue props
addTree(4.4, 5.8, 0.75);
addFallenLog(-7.4, 18.5, 0.25, 0.65);

for (let i = 0; i < 6; i++) {
  const track = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.035, 1.7),
    new THREE.MeshStandardMaterial({ color: "#2d241c", roughness: 1 })
  );
  track.position.set(5.2 + (i % 2) * 1.15, heightAt(6, 35) + 0.065, 33 + i * 0.8);
  track.rotation.y = 0.08;
  scene.add(track);
}

// =====================================================
// FIREFLIES / ATMOSPHERE
// =====================================================
const fireflies = [];
const fireflyMat = new THREE.MeshBasicMaterial({ color: "#ffe98b" });

for (let i = 0; i < 55; i++) {
  const f = new THREE.Mesh(new THREE.SphereGeometry(rand(0.035, 0.065), 8, 8), fireflyMat);
  f.position.set(rand(-25, 25), rand(1.0, 4.0), rand(2, 48));
  scene.add(f);

  const light = new THREE.PointLight("#ffe98b", 0.18, 3);
  light.position.copy(f.position);
  scene.add(light);

  fireflies.push({
    mesh: f,
    light,
    baseX: f.position.x,
    baseY: f.position.y,
    baseZ: f.position.z,
    phase: rand(0, Math.PI * 2)
  });
}

// =====================================================
// INPUT
// =====================================================
const keys = {};
let rightMouseDown = false;
let cameraYaw = 0;
let cameraPitch = 0.34;
let cameraDistance = 9.5;

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === "e") tryInteract();
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

window.addEventListener("mousedown", (e) => {
  if (e.button === 2) {
    rightMouseDown = true;
    document.body.style.cursor = "grabbing";
  }
});

window.addEventListener("mouseup", (e) => {
  if (e.button === 2) {
    rightMouseDown = false;
    document.body.style.cursor = "";
  }
});

window.addEventListener("mousemove", (e) => {
  if (!rightMouseDown) return;

  cameraYaw -= e.movementX * 0.0042;
  cameraPitch -= e.movementY * 0.0032;
  cameraPitch = clamp(cameraPitch, -0.05, 0.82);
});

window.addEventListener(
  "wheel",
  (e) => {
    cameraDistance += e.deltaY * 0.008;
    cameraDistance = clamp(cameraDistance, 5.8, 16);
  },
  { passive: true }
);

// =====================================================
// GAME STATE / STORY
// =====================================================
let introDone = false;
let storyTimer = 0;
let clueStep = 0;
let messageLockTimer = 0;

setStory("The forest is quiet...");
setObjective("Wake up.");

function tryInteract() {
  if (!introDone) return;
  if (clueStep >= clues.length) return;

  const clue = clues[clueStep];
  const dx = bear.position.x - clue.userData.x;
  const dz = bear.position.z - clue.userData.z;
  const d = Math.hypot(dx, dz);

  if (d > 3.0) return;

  if (clueStep === 0) {
    setStory("Thunder. Heavy footsteps. Dad roaring. Mom pushed you beneath the roots.");
    setObjective("Find something that smells like Mom.");
    messageLockTimer = 4.6;
  } else if (clueStep === 1) {
    setStory("Mom was here. Her scent is trapped in the torn rope.");
    setObjective("Follow Mom's scent deeper into the forest.");
    messageLockTimer = 4.4;
  } else if (clueStep === 2) {
    setStory("The ground smells like humans. Mom did not leave. Mom was taken.");
    setObjective("Find where the humans went.");
    messageLockTimer = 5.0;
  }

  clue.visible = false;
  clueStep++;
}

function updateIntro(dt) {
  if (introDone) return;

  storyTimer += dt;

  if (storyTimer < 2.2) {
    setStory("The forest is quiet...");
  } else if (storyTimer < 5.2) {
    setStory("Mom?");
  } else {
    introDone = true;
    setStory("");
    setObjective("Look around the broken den.");
  }
}

// =====================================================
// MOVEMENT / ANIMATION
// =====================================================
const velocity = new THREE.Vector3();

function updateBearMovement(dt) {
  if (!introDone) return;

  let inputX = 0;
  let inputZ = 0;

  if (keys["w"] || keys["arrowup"]) inputZ -= 1;
  if (keys["s"] || keys["arrowdown"]) inputZ += 1;
  if (keys["a"] || keys["arrowleft"]) inputX -= 1;
  if (keys["d"] || keys["arrowright"]) inputX += 1;

  const forward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
  const right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));

  const move = new THREE.Vector3();
  move.addScaledVector(forward, -inputZ);
  move.addScaledVector(right, inputX);

  const moving = move.lengthSq() > 0.001;
  const run = keys["shift"];
  const speed = run ? 8.0 : 5.2;

  if (moving) {
    move.normalize();
    const targetVel = move.multiplyScalar(speed);
    velocity.lerp(targetVel, 1 - Math.pow(0.00008, dt));

    const targetYaw = Math.atan2(velocity.x, velocity.z);
    bear.rotation.y = lerpAngle(bear.rotation.y, targetYaw, 1 - Math.pow(0.00005, dt));
  } else {
    velocity.multiplyScalar(Math.pow(0.0008, dt));
  }

  bear.position.x += velocity.x * dt;
  bear.position.z += velocity.z * dt;

  bear.position.x = clamp(bear.position.x, -120, 120);
  bear.position.z = clamp(bear.position.z, -120, 120);

  const targetY = heightAt(bear.position.x, bear.position.z);
  bear.position.y = THREE.MathUtils.lerp(bear.position.y, targetY, 1 - Math.pow(0.0001, dt));

  updateBearAnimation(dt, velocity.length(), run);
}

function updateBearAnimation(dt, moveSpeed, running) {
  const moving = moveSpeed > 0.25;
  const cycleSpeed = running ? 10.5 : 7.4;

  if (moving) {
    bearRig.walkCycle += dt * cycleSpeed;
  } else {
    bearRig.walkCycle += dt * 2.2;
  }

  const c = bearRig.walkCycle;
  const swing = moving ? Math.sin(c) * (running ? 0.65 : 0.48) : Math.sin(c) * 0.05;
  const swingOpp = moving ? Math.sin(c + Math.PI) * (running ? 0.65 : 0.48) : Math.sin(c + Math.PI) * 0.05;

  const bob = moving ? Math.sin(c * 2) * (running ? 0.07 : 0.045) : Math.sin(c * 1.2) * 0.012;
  bearRig.model.position.y = bob;
  bearRig.model.rotation.x = moving ? Math.sin(c * 2) * 0.035 : 0;

  bearRig.frontLeft.upper.rotation.x = swing;
  bearRig.backRight.upper.rotation.x = swing;
  bearRig.frontRight.upper.rotation.x = swingOpp;
  bearRig.backLeft.upper.rotation.x = swingOpp;

  bearRig.frontLeft.lower.rotation.x = Math.max(0, -swing) * 0.5;
  bearRig.backRight.lower.rotation.x = Math.max(0, -swing) * 0.5;
  bearRig.frontRight.lower.rotation.x = Math.max(0, -swingOpp) * 0.5;
  bearRig.backLeft.lower.rotation.x = Math.max(0, -swingOpp) * 0.5;

  bearRig.head.rotation.x = moving ? Math.sin(c * 2 + 0.8) * 0.045 : Math.sin(c * 0.75) * 0.02;
  bearRig.leftEar.rotation.x = Math.sin(c * 1.4) * 0.04;
  bearRig.rightEar.rotation.x = Math.sin(c * 1.4 + 0.3) * 0.04;

  bearRig.shadowBlob.position.y = 0.025;
  bearRig.shadowBlob.scale.set(1.05 + moveSpeed * 0.015, 1.05 + moveSpeed * 0.015, 1);
}

// =====================================================
// PROMPTS
// =====================================================
function updatePrompt(dt) {
  if (messageLockTimer > 0) {
    messageLockTimer -= dt;
    return;
  }

  if (!introDone || clueStep >= clues.length) return;

  const clue = clues[clueStep];
  const dx = bear.position.x - clue.userData.x;
  const dz = bear.position.z - clue.userData.z;
  const d = Math.hypot(dx, dz);

  if (d <= 3.0) {
    setStory("Press E to inspect the " + clue.userData.name + ".");
  } else if (storyEl && storyEl.textContent.startsWith("Press E")) {
    setStory("");
  }
}

// =====================================================
// CAMERA
// =====================================================
function updateCamera(dt) {
  const cosPitch = Math.cos(cameraPitch);
  const sinPitch = Math.sin(cameraPitch);

  const offset = new THREE.Vector3(
    Math.sin(cameraYaw) * cosPitch * cameraDistance,
    3.2 + sinPitch * cameraDistance,
    Math.cos(cameraYaw) * cosPitch * cameraDistance
  );

  const lookTarget = new THREE.Vector3(
    bear.position.x,
    bear.position.y + 1.25,
    bear.position.z
  );

  const desiredPos = lookTarget.clone().add(offset);

  camera.position.lerp(desiredPos, 1 - Math.pow(0.00004, dt));
  camera.lookAt(lookTarget);
}

// =====================================================
// ANIMATE ENVIRONMENT
// =====================================================
function updateWorld(dt, now) {
  for (const clue of clues) {
    if (!clue.visible) continue;

    const orb = clue.userData.orb;
    const ring = clue.userData.ring;
    const light = clue.userData.light;

    const pulse = Math.sin(now * 0.003 + clue.position.x) * 0.12;
    orb.position.y = clue.userData.baseY + 1.05 + pulse;
    ring.rotation.z += dt * 0.85;
    light.intensity = 2.7 + Math.sin(now * 0.004) * 0.5;
  }

  for (const f of fireflies) {
    f.phase += dt;

    f.mesh.position.x = f.baseX + Math.sin(f.phase * 1.25) * 0.8;
    f.mesh.position.y = f.baseY + Math.sin(f.phase * 2.0) * 0.28;
    f.mesh.position.z = f.baseZ + Math.cos(f.phase * 1.1) * 0.8;

    f.light.position.copy(f.mesh.position);
    f.light.intensity = 0.12 + Math.sin(f.phase * 2.7) * 0.05;
  }
}

// =====================================================
// MAIN LOOP
// =====================================================
let lastTime = performance.now();

function animate(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  updateIntro(dt);
  updateBearMovement(dt);
  updatePrompt(dt);
  updateCamera(dt);
  updateWorld(dt, now);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// =====================================================
// RESIZE
// =====================================================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
