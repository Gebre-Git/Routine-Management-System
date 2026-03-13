import * as THREE from 'three';

interface SpringParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  origin: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
}

export function initScene(canvas: HTMLCanvasElement): () => void {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(65, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
  camera.position.set(0, 0, 30);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0x8b5cf6, 3, 60);
  pointLight1.position.set(-10, 15, 10);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x06b6d4, 2, 60);
  pointLight2.position.set(10, -10, 5);
  scene.add(pointLight2);

  const pointLight3 = new THREE.PointLight(0xec4899, 1.5, 40);
  pointLight3.position.set(0, 0, 20);
  scene.add(pointLight3);

  // Create particles
  const particles: SpringParticle[] = [];
  const mouse = new THREE.Vector2(0, 0);
  const mouseWorld = new THREE.Vector3(0, 0, 0);

  const geometries = [
    new THREE.IcosahedronGeometry(0.6, 0),
    new THREE.OctahedronGeometry(0.6, 0),
    new THREE.TetrahedronGeometry(0.7, 0),
    new THREE.BoxGeometry(0.8, 0.8, 0.8),
    new THREE.TorusGeometry(0.4, 0.15, 8, 6),
    new THREE.ConeGeometry(0.5, 0.9, 5),
  ];

  const materials = [
    new THREE.MeshPhongMaterial({ color: 0x8b5cf6, shininess: 100, transparent: true, opacity: 0.85, wireframe: false }),
    new THREE.MeshPhongMaterial({ color: 0x06b6d4, shininess: 100, transparent: true, opacity: 0.8 }),
    new THREE.MeshPhongMaterial({ color: 0xec4899, shininess: 80, transparent: true, opacity: 0.75 }),
    new THREE.MeshPhongMaterial({ color: 0x4ade80, shininess: 90, transparent: true, opacity: 0.7 }),
    new THREE.MeshPhongMaterial({ color: 0xf59e0b, shininess: 110, transparent: true, opacity: 0.8 }),
  ];

  // Spawn floating objects
  const count = 55;
  for (let i = 0; i < count; i++) {
    const geo = geometries[Math.floor(Math.random() * geometries.length)];
    const mat = materials[Math.floor(Math.random() * materials.length)];
    const mesh = new THREE.Mesh(geo, mat);

    const spread = 30;
    const origin = new THREE.Vector3(
      (Math.random() - 0.5) * spread * 2,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * 20 - 5
    );

    mesh.position.copy(origin);
    mesh.scale.setScalar(Math.random() * 0.8 + 0.4);

    const rotSpeed = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.01
    );

    scene.add(mesh);
    particles.push({
      mesh,
      velocity: new THREE.Vector3(),
      origin,
      rotationSpeed: rotSpeed,
    });
  }

  // Particle system (small floating dots)
  const dotCount = 200;
  const dotPositions = new Float32Array(dotCount * 3);
  for (let i = 0; i < dotCount; i++) {
    dotPositions[i * 3] = (Math.random() - 0.5) * 70;
    dotPositions[i * 3 + 1] = (Math.random() - 0.5) * 50;
    dotPositions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 10;
  }
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));
  const dotMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.5 });
  const dots = new THREE.Points(dotGeo, dotMat);
  scene.add(dots);

  // Mouse tracking
  const onMouseMove = (e: MouseEvent) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    const aspect = canvas.clientWidth / canvas.clientHeight;
    mouseWorld.set(mouse.x * 18 * aspect, mouse.y * 15, 0);
  };
  window.addEventListener('mousemove', onMouseMove);

  // Resize
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  // Spring constants
  const SPRING_STRENGTH = 0.03;
  const DAMPING = 0.88;
  const REPULSION_RADIUS = 7;
  const REPULSION_STRENGTH = 0.6;

  let animId = 0;
  const clock = new THREE.Clock();

  const animate = () => {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Animate lights
    pointLight1.position.x = Math.sin(t * 0.4) * 15;
    pointLight1.position.y = Math.cos(t * 0.3) * 10;
    pointLight2.position.x = Math.cos(t * 0.35) * 12;
    pointLight2.position.y = Math.sin(t * 0.45) * 8;

    // Update floating particles
    for (const p of particles) {
      // Spring back to origin
      const springForce = p.origin.clone().sub(p.mesh.position).multiplyScalar(SPRING_STRENGTH);

      // Add subtle drift
      springForce.y += Math.sin(t * 0.5 + p.origin.x * 0.3) * 0.002;
      springForce.x += Math.cos(t * 0.4 + p.origin.y * 0.2) * 0.001;

      // Mouse repulsion
      const toMouse = p.mesh.position.clone().sub(mouseWorld);
      toMouse.z = 0;
      const dist = toMouse.length();
      if (dist < REPULSION_RADIUS && dist > 0.01) {
        const repulse = toMouse.normalize().multiplyScalar(REPULSION_STRENGTH * (1 - dist / REPULSION_RADIUS));
        p.velocity.add(repulse);
      }

      p.velocity.add(springForce);
      p.velocity.multiplyScalar(DAMPING);
      p.mesh.position.add(p.velocity);

      // Rotation
      p.mesh.rotation.x += p.rotationSpeed.x;
      p.mesh.rotation.y += p.rotationSpeed.y;
      p.mesh.rotation.z += p.rotationSpeed.z;
    }

    // Rotate dot cloud slowly
    dots.rotation.y = t * 0.02;
    dots.rotation.x = t * 0.01;

    renderer.render(scene, camera);
  };

  animate();

  // Return cleanup function
  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());
    dotGeo.dispose();
    dotMat.dispose();
  };
}
