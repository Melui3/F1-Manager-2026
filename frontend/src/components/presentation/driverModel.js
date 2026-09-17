import * as THREE from "three";

// Original helmeted figure: team identity, not a scan or likeness of a real driver.
export function createDriverModel(livery, driver) {
    const group = new THREE.Group();
    const suit = new THREE.MeshStandardMaterial({ color: livery.color, roughness: 0.85, envMapIntensity: 0.2 });
    const accent = new THREE.MeshStandardMaterial({ color: livery.secondary, roughness: 0.65 });
    const dark = new THREE.MeshStandardMaterial({ color: "#1c2025", roughness: 0.8 });
    const white = new THREE.MeshStandardMaterial({ color: "#eceef0", roughness: 0.8 });
    const shell = new THREE.MeshPhysicalMaterial({ color: livery.secondary, roughness: 0.24, metalness: 0.12, clearcoat: 0.8 });
    const visor = new THREE.MeshPhysicalMaterial({ color: "#162b37", metalness: 0.75, roughness: 0.18, clearcoat: 1 });
    function mesh(geometry, material, position, scale = [1, 1, 1]) {
        const object = new THREE.Mesh(geometry, material);
        object.position.set(...position);
        object.scale.set(...scale);
        object.castShadow = true;
        object.receiveShadow = true;
        group.add(object);
        return object;
    }
    function limb(a, b, radius, material = suit) {
        const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b);
        const length = from.distanceTo(to);
        const object = mesh(new THREE.CapsuleGeometry(radius, Math.max(0.02, length - radius * 2), 8, 16), material, from.clone().add(to).multiplyScalar(0.5).toArray());
        object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.sub(from).normalize());
        return object;
    }
    for (const side of [-1, 1]) {
        mesh(new THREE.SphereGeometry(1, 24, 16), dark, [side * 0.19, 0.12, 0.11], [0.15, 0.12, 0.29]);
        mesh(new THREE.BoxGeometry(0.19, 0.035, 0.34), accent, [side * 0.19, 0.15, 0.14]);
        limb([side * 0.19, 0.19, 0], [side * 0.2, 0.8, -0.035], 0.125);
        limb([side * 0.2, 0.76, -0.035], [side * 0.19, 1.4, 0], 0.16);
        mesh(new THREE.SphereGeometry(1, 20, 12), suit, [side * 0.2, 0.83, 0.05], [0.1, 0.15, 0.045]);
        limb([side * 0.345, 2.04, 0], [side * 0.57, 1.71, 0.02], 0.135);
        limb([side * 0.57, 1.7, 0.02], [side * 0.4, 1.42, 0.18], 0.105);
        limb([side * 0.54, 1.66, 0.05], [side * 0.49, 1.58, 0.1], 0.111, accent);
        mesh(new THREE.SphereGeometry(1, 20, 16), white, [side * 0.38, 1.38, 0.19], [0.095, 0.13, 0.07]);
        mesh(new THREE.SphereGeometry(1, 20, 16), accent, [side * 0.34, 2.08, 0], [0.16, 0.055, 0.14]);
    }
    mesh(new THREE.SphereGeometry(1, 24, 20), suit, [0, 1.36, 0], [0.34, 0.23, 0.2]);
    const profile = [[0, 1.36], [0.25, 1.39], [0.29, 1.6], [0.38, 1.98], [0.36, 2.08], [0.16, 2.16], [0, 2.16]].map(([r, y]) => new THREE.Vector2(r, y));
    mesh(new THREE.LatheGeometry(profile, 40), suit, [0, 0, 0], [1, 1, 0.62]);
    mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.065, 32), dark, [0, 1.47, 0], [1, 1, 0.74]);
    mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.15, 24), dark, [0, 2.19, 0]);
    mesh(new THREE.TorusGeometry(0.15, 0.035, 8, 30), accent, [0, 2.16, 0]).rotation.x = Math.PI / 2;
    mesh(new THREE.SphereGeometry(1, 40, 32), shell, [0, 2.48, 0.015], [0.28, 0.33, 0.285]);
    mesh(new THREE.SphereGeometry(0.29, 40, 16, 0, Math.PI, Math.PI * 0.37, Math.PI * 0.27), visor, [0, 2.48, 0.025], [1, 1.08, 1]);
    mesh(new THREE.SphereGeometry(1, 28, 16), suit, [0, 2.29, 0.115], [0.24, 0.075, 0.2]);
    for (const x of [-0.12, 0.12]) mesh(new THREE.BoxGeometry(0.07, 0.022, 0.015), dark, [x, 2.32, 0.293]);
    const stripe = mesh(new THREE.TorusGeometry(0.279, 0.017, 8, 48), suit, [0, 2.48, 0.015]);
    stripe.rotation.z = Math.PI / 2;
    stripe.scale.set(1.16, 1, 1);
    function label(text, width, height, position, reverse = false) {
        const canvas = document.createElement("canvas");
        canvas.width = 512; canvas.height = 256;
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.font = "900 125px Arial";
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText(String(text).toUpperCase(), 256, 132, 480);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        const object = mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }), position);
        if (reverse) object.rotation.y = Math.PI;
    }
    label(livery.name, 0.5, 0.15, [0, 1.98, 0.24]);
    label(driver.number, 0.25, 0.24, [0, 1.76, 0.21]);
    label(driver.number, 0.38, 0.36, [0, 1.85, -0.239], true);
    label(driver.surname.slice(0, 3), 0.31, 0.12, [0, 2.06, -0.237], true);
    return group;
}
