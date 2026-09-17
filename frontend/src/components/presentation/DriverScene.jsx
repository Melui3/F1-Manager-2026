import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createDriverModel } from "./driverModel";
import { disposeObject } from "./raceCarModel";

export default function DriverScene({ driver, livery, paused, reduced, angle, onUnavailable, onReady, onDrag }) {
    const hostRef = useRef(null);
    const runtimeRef = useRef(null);
    const current = useRef({});
    current.current = { paused, reduced, onUnavailable, onReady, onDrag };
    useEffect(() => {
        const host = hostRef.current;
        delete host.dataset.rendered;
        let renderer;
        try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" }); }
        catch { current.current.onUnavailable(); return; }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setClearColor("#21272d");
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.85;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.domElement.setAttribute("aria-hidden", "true");
        host.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog("#21272d", 9, 24);
        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.minPolarAngle = 0.9;
        controls.maxPolarAngle = 1.65;
        controls.target.set(0, 1.43, 0);
        controls.autoRotateSpeed = 1.2;
        const drag = () => current.current.onDrag();
        controls.addEventListener("start", drag);
        scene.add(new THREE.HemisphereLight("#ffffff", "#4a4c50", 2));
        const light = new THREE.DirectionalLight("#ffffff", 2.5);
        light.position.set(-3, 6, 5);
        light.castShadow = true;
        light.shadow.mapSize.set(512, 512);
        Object.assign(light.shadow.camera, { left: -3, right: 3, top: 4, bottom: -4, far: 20 });
        light.shadow.bias = -0.001;
        scene.add(light);
        const rim = new THREE.DirectionalLight("#d8edff", 1.8);
        rim.position.set(3, 3, -4);
        scene.add(rim);
        const generator = new THREE.PMREMGenerator(renderer);
        const room = new RoomEnvironment();
        const environment = generator.fromScene(room);
        scene.environment = environment.texture;
        room.dispose(); generator.dispose();
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: "#252c32", roughness: 0.95 }));
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.01;
        floor.receiveShadow = true;
        scene.add(floor);
        const figure = createDriverModel(livery, driver);
        scene.add(figure);
        const baseline = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.025), new THREE.MeshBasicMaterial({ color: livery.color }));
        baseline.rotation.x = -Math.PI / 2;
        baseline.position.set(0, 0.005, -0.8);
        scene.add(baseline);
        let visible = true, frame, lastFrame = 0, ready = false;
        const runtime = { dirty: true, controls, frameAngle: angle, reset: null };
        runtimeRef.current = runtime;
        function reset() {
            const { width, height } = host.getBoundingClientRect();
            if (!width || !height) return;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            const distance = 6.6 * Math.max(1, 0.7 / camera.aspect);
            camera.position.set(Math.sin(runtime.frameAngle) * distance, 1.85, Math.cos(runtime.frameAngle) * distance);
            controls.target.set(0, 1.43, 0);
            controls.enableDamping = false;
            controls.update(0);
            controls.enableDamping = true;
            runtime.dirty = true;
        }
        runtime.reset = reset;
        const resizeObserver = new ResizeObserver(reset);
        resizeObserver.observe(host);
        const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
        visibility.observe(host);
        const contextLost = (event) => { event.preventDefault(); current.current.onUnavailable(); };
        renderer.domElement.addEventListener("webglcontextlost", contextLost);
        reset();
        function tick(now) {
            frame = requestAnimationFrame(tick);
            if (!visible || document.hidden || now - lastFrame < 1000 / 30) return;
            const delta = Math.min((now - lastFrame) / 1000, 0.05);
            lastFrame = now;
            controls.autoRotate = !current.current.paused && !current.current.reduced;
            const moved = controls.update(delta);
            if (ready && !runtime.dirty && !moved) return;
            renderer.render(scene, camera);
            runtime.dirty = false;
            if (!ready) { ready = true; host.dataset.rendered = "true"; current.current.onReady(); }
        }
        frame = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(frame);
            resizeObserver.disconnect(); visibility.disconnect();
            controls.removeEventListener("start", drag); controls.dispose();
            renderer.domElement.removeEventListener("webglcontextlost", contextLost);
            disposeObject(scene); environment.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
            runtimeRef.current = null;
        };
        // A driver change replaces the figure and its generated number textures.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [driver.id, livery]);
    useEffect(() => {
        const runtime = runtimeRef.current;
        if (runtime) { runtime.frameAngle = angle; runtime.reset(); }
    }, [angle]);
    useEffect(() => {
        const runtime = runtimeRef.current;
        if (!runtime || (!paused && !reduced)) return;
        runtime.controls.autoRotate = false;
        runtime.controls.enableDamping = false;
        runtime.controls.update(0);
        runtime.controls.enableDamping = true;
        runtime.dirty = true;
    }, [paused, reduced]);
    return <div className="driver-model-canvas" ref={hostRef} />;
}
