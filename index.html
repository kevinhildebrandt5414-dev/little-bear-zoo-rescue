import * as THREE from "three";

const objectiveEl = document.getElementById("objective");
const storyEl = document.getElementById("storyText");

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color("#101d16");
scene.fog = new THREE.Fog("#101d16", 12, 70);

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(0, 6, 10);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const sun = new THREE.DirectionalLight("#fff0c2", 2.2);
sun.position.set(10, 20, 8);
sun.castShadow = true;
scene.add(sun);

const ambient = new THREE.AmbientLight("#9cc7ff", 0.7);
scene.add(ambient);

// Ground
const groundGeo = new THREE.PlaneGeometry(160, 160);
const groundMat = new THREE.MeshStandardMaterial({ color: "#27452a" });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Baby bear made from simple shapes
const bear = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.SphereGeometry(0.65, 24, 16),
  new THREE.MeshStandardMaterial({ color: "#7a4b2a" })
);
body.scale.set(1.2, 0.8, 1.5);
body.castShadow = true;
bear.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.45, 24, 16),
  new THREE.MeshStandardMaterial({ color: "#8a5630" })
);
head.position.set(0, 0.45, -0.65);
head.castShadow = true;
bear.add(head);

const earGeo = new THREE.SphereGeometry(0.16, 16, 12);
const earMat = new THREE.MeshStandardMaterial({ color: "#6d3f23" });

const leftEar = new THREE.Mesh(earGeo, earMat);
leftEar.position.set(-0.28, 0.78, -0.7);
bear.add(leftEar);

const rightEar = new THREE.Mesh(earGeo, earMat);
rightEar.position.set(0.28, 0.78, -0.7);
bear.add(rightEar);

bear.position.set(0, 0.65, 0);
scene.add(bear);

// Forest trees
function makeTree(x, z, scale = 1) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25 * scale, 0.35 * scale, 4 * scale, 10),
    new THREE.MeshStandardMaterial({ color: "#4a2d1b" })
  );
  trunk.position.y = 2 * scale;
  trunk.castShadow = true;
  tree.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(1.6 * scale, 4 * scale, 12),
    new THREE.MeshStandardMaterial({ color: "#1f5a34" })
  );
  leaves.position.y = 5 * scale;
  leaves.castShadow = true;
  tree.add(leaves);

  tree.position.set(x, 0, z);
  scene.add(tree);
}

for (let i = 0; i < 90; i++) {
  const x = (Math.random() - 0.5) * 130;
  const z = (Math.random() - 0.5) * 130;

  if (Math.hypot(x, z) < 8) continue;

  makeTree(x, z, 0.7 + Math.random() * 1.1);
}

// Glowing clue objects
function makeClue(name, x, z, color) {
  const clue = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 24, 16),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.5
    })
  );
  clue.name = name;
  clue.position.set(x, 0.45, z);
  scene.add(clue);

  const light = new THREE.PointLight(color, 2.5, 8);
  light.position.set(x, 1.2, z);
  scene.add(light);

  return clue;
}

const clues = [
  makeClue("claw marks", 4, 3, "#ffe680"),
  makeClue("torn net", -5, 10, "#82d8ff"),
  makeClue("tire tracks", 2, 20, "#ff9a6b")
];

let clueStep = 0;
let storyTimer = 0;
let introDone = false;

const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  if (e.key.toLowerCase() === "e") {
    tryInteract();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

function setStory(text) {
  storyEl.textContent = text;
}

function setObjective(text) {
  objectiveEl.textContent = "Objective: " + text;
}

function tryInteract() {
  if (!introDone) return;
  if (clueStep >= clues.length) return;

  const clue = clues[clueStep];
  const distance = bear.position.distanceTo(clue.position);

  if (distance > 2.3) return;

  if (clueStep === 0) {
    setStory("Thunder. Heavy footsteps. Dad roaring. Mom pushed you into the roots.");
    setObjective("Find something that smells like Mom.");
  }

  if (clueStep === 1) {
    setStory("Mom was here. Her scent is trapped in the torn rope.");
    setObjective("Follow Mom's scent deeper into the forest.");
  }

  if (clueStep === 2) {
    setStory("The ground smells like humans. Mom did not leave. Mom was taken.");
    setObjective("Find where the humans went.");
  }

  clue.visible = false;
  clueStep++;
}

function updateIntro(dt) {
  if (introDone) return;

  storyTimer += dt;

  if (storyTimer > 2 && storyTimer < 5) {
    setStory("Mom?");
  }

  if (storyTimer >= 5) {
    introDone = true;
    setStory("");
    setObjective("Look around the broken den.");
  }
}

function updateMovement(dt) {
  if (!introDone) return;

  let moveX = 0;
  let moveZ = 0;

  if (keys["w"] || keys["arrowup"]) moveZ -= 1;
  if (keys["s"] || keys["arrowdown"]) moveZ += 1;
  if (keys["a"] || keys["arrowleft"]) moveX -= 1;
  if (keys["d"] || keys["arrowright"]) moveX += 1;

  const move = new THREE.Vector3(moveX, 0, moveZ);

  if (move.length() > 0) {
    move.normalize();
    bear.position.add(move.multiplyScalar(5 * dt));

    const angle = Math.atan2(moveX, moveZ);
    bear.rotation.y = angle;
  }
}

function updateCluePrompt() {
  if (!introDone || clueStep >= clues.length) return;

  const clue = clues[clueStep];
  const distance = bear.position.distanceTo(clue.position);

  if (distance <= 2.3) {
    setStory("Press E to inspect the " + clue.name + ".");
  } else if (storyEl.textContent.startsWith("Press E")) {
    setStory("");
  }
}

function updateCamera(dt) {
  const cameraTarget = new THREE.Vector3(
    bear.position.x,
    bear.position.y + 5,
    bear.position.z + 9
  );

  camera.position.lerp(cameraTarget, 1 - Math.pow(0.001, dt));
  camera.lookAt(bear.position.x, bear.position.y + 0.8, bear.position.z);
}

let lastTime = performance.now();

function animate(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  updateIntro(dt);
  updateMovement(dt);
  updateCluePrompt();
  updateCamera(dt);

  for (const clue of clues) {
    clue.rotation.y += dt * 1.5;
    clue.position.y = 0.45 + Math.sin(now * 0.003 + clue.position.x) * 0.08;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
