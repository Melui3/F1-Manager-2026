import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createRaceCar, disposeObject } from "../presentation/raceCarModel";
import { getTeamLivery } from "../../data/teamLiveries";

function createCircuit(technical) {
    const coordinates = technical
        ? [[-25, -14], [-8, -14], [15, -14], [27, -7], [25, 4], [14, 6], [20, 17], [7, 20], [-1, 10], [-14, 18], [-26, 9], [-20, -1]]
        : [[-25, -14], [-8, -14], [15, -14], [28, -6], [29, 7], [18, 18], [6, 14], [-5, 21], [-24, 14], [-29, 3], [-20, -5]];
    return new THREE.CatmullRomCurve3(coordinates.map(([x, z]) => new THREE.Vector3(x, 0.07, z)), true, "catmullrom", 0.32);
}

function ribbon(curve, inner, outer, material) {
    const vertices = [];
    const indices = [];
    for (let i = 0; i <= 360; i++) {
        const point = curve.getPointAt(i / 360);
        const tangent = curve.getTangentAt(i / 360);
        for (const offset of [inner, outer]) vertices.push(point.x - tangent.z * offset, point.y, point.z + tangent.x * offset);
        if (i < 360) {
            const a = i * 2;
            indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    return mesh;
}

function buildTrack(scene, curve) {
    const occluders = [];
    const asphalt = new THREE.MeshPhongMaterial({ color: "#333940", shininess: 4, side: THREE.DoubleSide });
    scene.add(ribbon(curve, -1.75, 1.75, asphalt));
    for (const side of [-1, 1]) {
        const line = ribbon(curve, side * 1.63, side * 1.68, new THREE.MeshBasicMaterial({ color: "#f0eddd", side: THREE.DoubleSide }));
        line.position.y = 0.012;
        scene.add(line);
    }
    const curbs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.055, 0.32), new THREE.MeshPhongMaterial({ color: "#ffffff" }), 600);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 300; i++) {
        const point = curve.getPointAt(i / 300);
        const tangent = curve.getTangentAt(i / 300);
        for (const [s, side] of [-1, 1].entries()) {
            dummy.position.set(point.x - tangent.z * 1.9 * side, 0.08, point.z + tangent.x * 1.9 * side);
            dummy.rotation.set(0, -Math.atan2(tangent.z, tangent.x), 0);
            dummy.updateMatrix();
            curbs.setMatrixAt(i * 2 + s, dummy.matrix);
            curbs.setColorAt(i * 2 + s, new THREE.Color(i % 2 ? "#ed4d48" : "#e9e7df"));
        }
    }
    scene.add(curbs);

    function box(size, position, color = "#89949c") {
        const part = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshPhongMaterial({ color }));
        part.position.set(...position);
        part.castShadow = true;
        part.receiveShadow = true;
        scene.add(part);
        if (size[1] > 0.4) occluders.push(part);
        return part;
    }
    // Pit building, garages and grandstands give the circuit a readable scale.
    box([23, 0.05, 1.8], [-6, 0.04, -17.7], "#737a80");
    box([21, 2.2, 2.5], [-6, 1.1, -20], "#c0c7cb");
    box([22, 0.18, 3], [-6, 2.3, -20], "#ecf0f3");
    for (let i = 0; i < 10; i++) {
        box([1.65, 1.25, 0.04], [-15 + i * 2, 0.7, -18.72], i % 2 ? "#26333c" : "#39454f");
        box([1.7, 0.15, 0.07], [-15 + i * 2, 1.55, -18.69], ["#e74e47", "#29bba4", "#f28e27", "#477fdd"][i % 4]);
    }
    for (let row = 0; row < 5; row++) {
        box([22, 0.45, 0.9], [-8, 0.3 + row * 0.38, -24 - row * 0.9], row % 2 ? "#476172" : "#8a9cac");
        box([15, 0.45, 0.9], [7, 0.3 + row * 0.38, 25 + row * 0.9], row % 2 ? "#8b4345" : "#caa48d");
    }
    box([0.25, 3.8, 0.25], [-18, 1.9, -12]);
    box([0.25, 3.8, 0.25], [-18, 1.9, -16]);
    box([0.45, 0.65, 4.5], [-18, 3.7, -14], "#ed443d");
    for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) box([0.25, 0.018, 0.42], [-18 + j * 0.25, 0.105, -15.5 + i * 0.42], (i + j) % 2 ? "#16191c" : "#ffffff");
    return { asphalt, occluders };
}

function createFleet(cars, playerId, scene) {
    const parts = [
        { size: [0.9, 0.16, 0.37], position: [0.08, 0.24, 0], paint: true },
        { size: [0.63, 0.09, 0.14], position: [-0.47, 0.2, 0], paint: true },
        { size: [0.15, 0.04, 0.65], position: [-0.73, 0.11, 0], paint: true },
        { size: [0.2, 0.06, 0.5], position: [0.61, 0.41, 0], paint: true },
        { size: [0.22, 0.15, 0.18], position: [0.09, 0.37, 0], color: "#11191d" },
        ...[-0.44, 0.43].flatMap((x) => [-1, 1].map((side) => ({ wheel: true, position: [x, 0.14, side * 0.3], color: "#131518" }))),
    ];
    return parts.map((part) => {
        const geometry = part.wheel ? new THREE.CylinderGeometry(0.13, 0.13, 0.13, 10).rotateX(Math.PI / 2) : new THREE.BoxGeometry(...part.size);
        const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshPhongMaterial({ color: part.color ?? "#ffffff", shininess: part.paint ? 65 : 2 }), cars.length);
        mesh.castShadow = true;
        mesh.frustumCulled = false;
        const local = new THREE.Matrix4().makeTranslation(...part.position);
        cars.forEach((car, i) => {
            mesh.setColorAt(i, new THREE.Color(part.paint ? getTeamLivery(car.team).body : "#ffffff"));
            if (car.id === playerId) mesh.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0));
        });
        scene.add(mesh);
        return { mesh, local };
    });
}

export default function RaceTrack({ race, entrants, player, progressRef, cameraMode, paused, reducedMotion, onUnavailable }) {
    const hostRef = useRef(null);
    const current = useRef({});
    current.current = { race, progressRef, cameraMode, paused, reducedMotion, onUnavailable };
    const identity = race?.id ?? `preview-${player?.id}`;

    useEffect(() => {
        const host = hostRef.current;
        let renderer;
        try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" }); }
        catch { current.current.onUnavailable(); return undefined; }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1 : 1.5));
        renderer.setClearColor("#14221f");
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.domElement.setAttribute("aria-hidden", "true");
        host.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog("#14221f", 120, 240);
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.minPolarAngle = 0.15;
        controls.maxPolarAngle = 1.1;
        controls.target.set(0, 0, 2);
        const environment = new RoomEnvironment();
        const generator = new THREE.PMREMGenerator(renderer);
        const environmentMap = generator.fromScene(environment);
        scene.environment = environmentMap.texture;
        environment.dispose();
        generator.dispose();
        scene.add(new THREE.HemisphereLight("#eaf6ff", "#2b4a2d", 2.1));
        const sun = new THREE.DirectionalLight("#fff3de", 3.2);
        sun.position.set(-35, 60, 20);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, far: 140 });
        sun.shadow.bias = -0.002;
        scene.add(sun);
        const grass = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshPhongMaterial({ color: "#2b5140", shininess: 0 }));
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = -0.02;
        grass.receiveShadow = true;
        scene.add(grass);
        const curve = createCircuit(race?.session?.circuit_type === "street");
        const { asphalt, occluders } = buildTrack(scene, curve);
        const cars = race?.cars ?? entrants;
        const playerId = race?.playerId ?? player?.id;
        const playerData = cars.find((car) => car.id === playerId) ?? player;
        const fleet = createFleet(cars, playerId, scene);
        const detailed = createRaceCar(getTeamLivery(playerData?.team), playerData?.number);
        detailed.group.scale.setScalar(0.25);
        scene.add(detailed.group);
        const marker = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 4), new THREE.MeshBasicMaterial({ color: "#fff2ac" }));
        marker.rotation.z = Math.PI;
        scene.add(marker);
        const dummy = new THREE.Object3D();
        const worldMatrix = new THREE.Matrix4();
        const desiredCamera = new THREE.Vector3();
        const sightline = new THREE.Vector3();
        const occlusionRay = new THREE.Raycaster();
        let faded = [];
        let frame;
        let lastFrame = 0;
        let lastMode;
        let hidden = false;
        let lost = false;
        let previousLap = -1;
        let previousProgress = -1;

        const overview = () => {
            const fit = Math.max(1, 1.35 / camera.aspect);
            camera.position.set(32 * fit, 55 * fit, 48 * fit);
            controls.target.set(0, 0, 2);
            camera.lookAt(controls.target);
            controls.update();
        };
        const resize = () => {
            const { width, height } = host.getBoundingClientRect();
            if (!width || !height) return;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            overview();
            previousProgress = -1;
        };
        const sizeObserver = new ResizeObserver(resize);
        sizeObserver.observe(host);
        const visibility = new IntersectionObserver(([entry]) => { hidden = !entry.isIntersecting; });
        visibility.observe(host);
        const contextLost = (event) => { event.preventDefault(); lost = true; current.current.onUnavailable(); };
        renderer.domElement.addEventListener("webglcontextlost", contextLost);
        resize();

        function animate(now) {
            frame = requestAnimationFrame(animate);
            if (hidden || lost || document.hidden || now - lastFrame < 1000 / 30) return;
            lastFrame = now;
            const { race: state, progressRef: progress, cameraMode: selectedCamera, reducedMotion: reduced } = current.current;
            const activeCars = state?.cars ?? cars;
            const lap = state?.lap ?? 0;
            const moving = state?.status === "racing";
            const fraction = reduced || !moving ? 0 : (progress?.current ?? 0);
            const mode = reduced ? "overview" : selectedCamera;
            const modeChanged = mode !== lastMode;
            if (modeChanged) {
                controls.enabled = mode === "overview";
                if (mode === "overview") overview();
                lastMode = mode;
            }
            const cameraMoved = controls.enabled && controls.update();
            if (host.dataset.rendered && lap === previousLap && fraction === previousProgress && !cameraMoved && !modeChanged && mode === "overview") return;
            previousLap = lap;
            previousProgress = fraction;
            const leaderTime = activeCars[0]?.totalTime ?? 0;
            let playerPoint;
            let playerTangent;
            cars.forEach((original, i) => {
                const car = activeCars.find((entry) => entry.id === original.id) ?? original;
                const gap = (car.totalTime ?? i * 0.55) - leaderTime;
                const offset = gap / 84 + i * (lap === 0 ? 0.004 : 0);
                const distance = ((lap + fraction - offset) % 1 + 1) % 1;
                const point = curve.getPointAt(distance);
                const tangent = curve.getTangentAt(distance);
                const lane = (i % 2 ? 1 : -1) * 0.37;
                point.x -= tangent.z * lane;
                point.z += tangent.x * lane;
                dummy.position.copy(point);
                dummy.rotation.set(0, Math.atan2(tangent.z, -tangent.x), 0);
                dummy.updateMatrix();
                if (car.id === playerId) {
                    detailed.group.position.copy(point);
                    detailed.group.rotation.copy(dummy.rotation);
                    marker.position.set(point.x, 1.3, point.z);
                    playerPoint = point;
                    playerTangent = tangent;
                    if (moving && !current.current.paused && !reduced) detailed.wheels.forEach((wheel) => { wheel.rotation.z += 0.25; });
                } else {
                    fleet.forEach(({ mesh, local }) => { worldMatrix.multiplyMatrices(dummy.matrix, local); mesh.setMatrixAt(i, worldMatrix); });
                }
            });
            fleet.forEach(({ mesh }) => { mesh.instanceMatrix.needsUpdate = true; });
            for (const object of faded) {
                object.material.opacity = 1;
                object.material.transparent = false;
                object.material.depthWrite = true;
            }
            faded = [];
            if (mode === "chase" && playerPoint) {
                desiredCamera.copy(playerPoint).addScaledVector(playerTangent, -7);
                desiredCamera.y += 7;
                camera.position.lerp(desiredCamera, 0.15);
                camera.lookAt(playerPoint.x + playerTangent.x * 3, 0.4, playerPoint.z + playerTangent.z * 3);
                // Keep the selected car visible when buildings or the gantry cross the sightline.
                sightline.copy(playerPoint).sub(camera.position);
                sightline.y += 0.3;
                occlusionRay.far = sightline.length();
                occlusionRay.set(camera.position, sightline.normalize());
                scene.updateMatrixWorld();
                faded = [...new Set(occlusionRay.intersectObjects(occluders, false).map((hit) => hit.object))];
                for (const object of faded) {
                    object.material.transparent = true;
                    object.material.opacity = 0.12;
                    object.material.depthWrite = false;
                }
            }
            asphalt.color.set(state?.wetness > 30 ? "#202e36" : "#333940");
            renderer.render(scene, camera);
            host.dataset.rendered = "true";
        }
        frame = requestAnimationFrame(animate);
        return () => {
            cancelAnimationFrame(frame);
            sizeObserver.disconnect();
            visibility.disconnect();
            controls.dispose();
            disposeObject(scene);
            environmentMap.dispose();
            renderer.domElement.removeEventListener("webglcontextlost", contextLost);
            renderer.dispose();
            renderer.forceContextLoss();
            renderer.domElement.remove();
        };
        // A new race owns a fresh scene; live timing is read through current.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [identity]);

    return <div ref={hostRef} className="live-track-canvas" />;
}
