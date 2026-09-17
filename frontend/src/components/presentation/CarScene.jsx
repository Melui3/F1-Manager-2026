import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createRaceCar, disposeObject } from "./raceCarModel";

export default function CarScene({ livery, number, playing = true, reducedMotion = false, view = "perspective", mode = "showroom", direction = 1, onReady, onUnavailable }) {
    const hostRef = useRef(null);
    const runtimeRef = useRef(null);
    const propsRef = useRef({});
    propsRef.current = { playing, reducedMotion, onReady, onUnavailable, direction };

    useEffect(() => {
        const host = hostRef.current;
        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
        } catch {
            propsRef.current.onUnavailable?.();
            return undefined;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.75));
        renderer.setClearColor("#202428");
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.95;
        renderer.domElement.setAttribute("aria-hidden", "true");
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog("#202428", 14, 35);
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.enabled = mode === "showroom";
        controls.minPolarAngle = 0.12;
        controls.maxPolarAngle = Math.PI / 2 - 0.05;
        controls.autoRotateSpeed = 0.65;
        controls.target.set(0, 0.45, 0);

        const pmrem = new THREE.PMREMGenerator(renderer);
        const room = new RoomEnvironment();
        const environment = pmrem.fromScene(room, 0.04);
        scene.environment = environment.texture;
        room.dispose();
        pmrem.dispose();
        scene.add(new THREE.HemisphereLight("#e8f4ff", "#292725", 1.4));
        const keyLight = new THREE.DirectionalLight("#ffffff", 3);
        keyLight.position.set(-3, 6, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        Object.assign(keyLight.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 20 });
        keyLight.shadow.bias = -0.001;
        scene.add(keyLight);
        const rimLight = new THREE.DirectionalLight("#ffffff", 1.5);
        rimLight.position.set(3, 3, -4);
        scene.add(rimLight);
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshPhongMaterial({ color: "#30363b", shininess: 0, specular: "#000000" }));
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.015;
        floor.receiveShadow = true;
        scene.add(floor);

        const floorLineMaterial = new THREE.MeshBasicMaterial({ color: "#4d5258" });
        for (const z of [-3, 3]) {
            const line = new THREE.Mesh(new THREE.PlaneGeometry(70, 0.035), floorLineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.003, z);
            scene.add(line);
        }
        const trackMarks = new THREE.Group();
        for (let i = -12; i < 13; i++) {
            const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.11), floorLineMaterial);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(i * 2, 0.006, 2.2);
            trackMarks.add(stripe);
        }
        scene.add(trackMarks);

        const state = { scene, camera, controls, car: null, view: "perspective", resize: null, dirty: true };
        runtimeRef.current = state;
        let visible = true;
        let ready = false;
        let started = null;
        let lastTime = null;
        let frame = 0;
        let failed = false;

        const resize = () => {
            const { width, height } = host.getBoundingClientRect();
            if (!width || !height) return;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            const fit = Math.max(1, 1.4 / camera.aspect);
            const preset = state.view === "side" ? [0, 1.55, 8.8] : state.view === "top" ? [-0.01, 10.5, 0.01] : [-4.4, 2.6, 5];
            camera.position.set(...preset.map((value) => value * fit));
            camera.updateProjectionMatrix();
            controls.update();
            state.dirty = true;
        };
        state.resize = resize;
        const observer = new ResizeObserver(resize);
        observer.observe(host);
        const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
        visibility.observe(host);
        resize();

        const loseContext = (event) => {
            event.preventDefault();
            failed = true;
            propsRef.current.onUnavailable?.();
        };
        renderer.domElement.addEventListener("webglcontextlost", loseContext);
        function animate(now) {
            frame = requestAnimationFrame(animate);
            if (failed || !visible || document.hidden || !state.car || (mode === "showroom" && document.getElementById("root")?.inert)) {
                lastTime = now;
                return;
            }
            const delta = Math.min((now - (lastTime ?? now)) / 1000, 0.05);
            lastTime = now;
            const { playing: shouldPlay, reducedMotion: reduced, direction: travelDirection } = propsRef.current;
            controls.autoRotate = shouldPlay && !reduced && mode === "showroom";
            if (mode === "flyby") {
                started ??= now;
                const t = Math.min((now - started) / 1550, 1);
                host.dataset.phase = t < 0.3 ? "arrival" : t < 0.67 ? "pass" : "exit";
                // Fast arrival, a brief readable pass, then acceleration out of frame.
                const x = t < 0.3 ? 14 * (1 - t / 0.3) ** 3 : t < 0.67 ? -0.5 * ((t - 0.3) / 0.37) : -0.5 - 18 * ((t - 0.67) / 0.33) ** 3;
                state.car.group.position.x = x * travelDirection;
                state.car.group.rotation.y = travelDirection === 1 ? 0 : Math.PI;
                state.car.wheels.forEach((wheel) => { wheel.rotation.z += delta * 40 * travelDirection; });
                trackMarks.position.x = ((now / 90) % 2) * travelDirection;
            }
            const moved = controls.update(delta);
            if (ready && !moved && !state.dirty && mode !== "flyby") return;
            renderer.render(scene, camera);
            state.dirty = false;
            if (!ready) {
                ready = true;
                host.dataset.rendered = "true";
                propsRef.current.onReady?.();
            }
        }
        frame = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            visibility.disconnect();
            controls.dispose();
            renderer.domElement.removeEventListener("webglcontextlost", loseContext);
            disposeObject(scene);
            environment.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            renderer.domElement.remove();
            runtimeRef.current = null;
        };
    }, [mode]);

    useEffect(() => {
        const runtime = runtimeRef.current;
        if (!runtime) return;
        if (runtime.car) {
            runtime.scene.remove(runtime.car.group);
            disposeObject(runtime.car.group);
        }
        runtime.car = createRaceCar(livery, number);
        runtime.scene.add(runtime.car.group);
        runtime.dirty = true;
    }, [livery, number]);

    useEffect(() => {
        const runtime = runtimeRef.current;
        if (!runtime) return;
        runtime.view = view;
        runtime.resize();
    }, [view]);

    useEffect(() => {
        const runtime = runtimeRef.current;
        if (!runtime || (playing && !reducedMotion)) return;
        // Flush camera inertia so Pause also stops the last automatic rotation.
        runtime.controls.autoRotate = false;
        runtime.controls.enableDamping = false;
        runtime.controls.update(0);
        runtime.controls.enableDamping = true;
        runtime.dirty = true;
    }, [playing, reducedMotion]);

    return <div ref={hostRef} className="race-car-canvas" data-mode={mode} />;
}
