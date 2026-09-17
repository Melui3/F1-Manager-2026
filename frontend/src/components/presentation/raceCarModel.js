import * as THREE from "three";

// A lightweight, original single-seater. Liveries are illustrative, not CAD replicas.
export function createRaceCar(livery, number = "26") {
    const group = new THREE.Group();
    const wheels = [];
    const paint = new THREE.MeshPhysicalMaterial({ color: livery.body, metalness: 0.12, roughness: 0.42, clearcoat: 0.65, clearcoatRoughness: 0.3, envMapIntensity: 0.4 });
    const primary = new THREE.MeshStandardMaterial({ color: livery.color, roughness: 0.44, metalness: 0.1 });
    const accent = new THREE.MeshStandardMaterial({ color: livery.secondary, metalness: 0.35, roughness: 0.3 });
    const carbon = new THREE.MeshStandardMaterial({ color: "#111215", metalness: 0.35, roughness: 0.48, envMapIntensity: 0.45 });
    const tire = new THREE.MeshStandardMaterial({ color: "#111214", roughness: 0.84, envMapIntensity: 0.15 });
    const metal = new THREE.MeshStandardMaterial({ color: "#666b70", metalness: 0.85, roughness: 0.25 });
    const tireMark = new THREE.MeshStandardMaterial({ color: "#e8ce38", roughness: 0.5 });

    function mesh(geometry, material, position = [0, 0, 0], parent = group) {
        const part = new THREE.Mesh(geometry, material);
        part.position.set(...position);
        part.castShadow = true;
        part.receiveShadow = true;
        parent.add(part);
        return part;
    }

    function box(size, position, material = carbon, parent = group) {
        return mesh(new THREE.BoxGeometry(...size), material, position, parent);
    }

    function rod(from, to, radius = 0.025, material = carbon) {
        const a = new THREE.Vector3(...from);
        const b = new THREE.Vector3(...to);
        const part = mesh(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 8), material);
        part.position.copy(a.add(b).multiplyScalar(0.5));
        part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...to).sub(new THREE.Vector3(...from)).normalize());
        return part;
    }

    function body(sections, material, z = 0) {
        const vertices = [];
        const indices = [];
        const sides = 12;
        sections.forEach(([x, y, width, height]) => {
            for (let i = 0; i < sides; i++) {
                const angle = (i / sides) * Math.PI * 2;
                vertices.push(x, y + Math.sin(angle) * height, z + Math.cos(angle) * width);
            }
        });
        for (let ring = 0; ring < sections.length - 1; ring++) {
            for (let side = 0; side < sides; side++) {
                const a = ring * sides + side;
                const b = ring * sides + (side + 1) % sides;
                indices.push(a, a + sides, b, b, a + sides, b + sides);
            }
        }
        for (let side = 1; side < sides - 1; side++) {
            indices.push(0, side, side + 1);
            const end = (sections.length - 1) * sides;
            indices.push(end, end + side + 1, end + side);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return mesh(geometry, material);
    }

    box([3.75, 0.08, 1.6], [0.15, 0.17, 0]);
    body([[-2.66, 0.35, 0.12, 0.075], [-2.1, 0.43, 0.19, 0.11], [-1.1, 0.58, 0.29, 0.2], [-0.5, 0.6, 0.39, 0.23], [0.7, 0.55, 0.43, 0.3], [1.9, 0.39, 0.15, 0.16]], paint);
    for (const side of [-1, 1]) {
        body([[-0.45, 0.49, 0.13, 0.14], [-0.05, 0.51, 0.29, 0.21], [0.7, 0.46, 0.31, 0.2], [1.45, 0.36, 0.16, 0.13], [1.75, 0.32, 0.04, 0.05]], paint, side * 0.55);
        box([2, 0.045, 0.07], [0.5, 0.235, side * 0.81], accent);
        box([1.55, 0.12, 0.06], [0.45, 0.38, side * 0.845], primary);
        const intake = mesh(new THREE.SphereGeometry(1, 16, 10), carbon, [-0.25, 0.52, side * 0.58]);
        intake.scale.set(0.06, 0.12, 0.19);
        box([0.36, 0.045, 0.22], [-0.76, 0.86, side * 0.53], paint);
        rod([-0.55, 0.69, side * 0.25], [-0.72, 0.86, side * 0.53], 0.018);
    }

    // Multi-element front and rear wings, with endplates and suspension wishbones.
    for (let i = 0; i < 3; i++) {
        box([0.16, 0.035, 2.1 - i * 0.08], [-2.67 + i * 0.16, 0.2 + i * 0.055, 0], i === 0 ? carbon : primary);
        box([0.22, 0.05, 1.62], [2.03 + i * 0.16, 1.04 + i * 0.07, 0], i === 1 ? accent : primary);
    }
    for (const side of [-1, 1]) {
        box([0.58, 0.2, 0.035], [-2.5, 0.27, side * 1.05], paint);
        box([0.6, 0.46, 0.045], [2.2, 0.92, side * 0.81], paint);
        rod([1.68, 0.39, side * 0.24], [2.19, 1.06, side * 0.24], 0.035);
        for (const axle of [-1.65, 1.55]) {
            rod([axle - 0.38, 0.32, side * 0.27], [axle, 0.38, side * 1.05]);
            rod([axle + 0.36, 0.33, side * 0.27], [axle, 0.38, side * 1.05]);
            rod([axle + 0.3, 0.64, side * 0.26], [axle, 0.4, side * 1.05], 0.02, metal);
        }
    }

    for (const axle of [-1.65, 1.55]) {
        for (const side of [-1, 1]) {
            const wheel = new THREE.Group();
            wheel.position.set(axle, 0.43, side * 1.05);
            group.add(wheel);
            wheels.push(wheel);
            const width = axle > 0 ? 0.39 : 0.32;
            const rubber = mesh(new THREE.CylinderGeometry(0.43, 0.43, width, 32), tire, [0, 0, 0], wheel);
            rubber.rotation.x = Math.PI / 2;
            for (const face of [-1, 1]) {
                const z = face * (width / 2 + 0.005);
                mesh(new THREE.TorusGeometry(0.345, 0.008, 5, 40), tireMark, [0, 0, z], wheel);
                mesh(new THREE.TorusGeometry(0.255, 0.019, 6, 24), metal, [0, 0, z], wheel);
                const hub = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.022, 12), metal, [0, 0, z], wheel);
                hub.rotation.x = Math.PI / 2;
                for (let spoke = 0; spoke < 8; spoke++) {
                    const angle = (spoke / 8) * Math.PI * 2;
                    const part = box([0.17, 0.025, 0.02], [Math.cos(angle) * 0.16, Math.sin(angle) * 0.16, z], metal, wheel);
                    part.rotation.z = angle;
                }
            }
        }
    }

    const cockpit = mesh(new THREE.SphereGeometry(1, 24, 12), carbon, [-0.1, 0.785, 0]);
    cockpit.scale.set(0.48, 0.095, 0.285);
    body([[0.3, 0.76, 0.22, 0.1], [0.58, 0.94, 0.2, 0.31], [1, 0.76, 0.13, 0.27], [1.8, 0.43, 0.055, 0.1]], paint);
    const airbox = mesh(new THREE.SphereGeometry(1, 16, 10), carbon, [0.48, 1.16, 0]);
    airbox.scale.set(0.06, 0.085, 0.1);
    const helmet = mesh(new THREE.SphereGeometry(0.17, 20, 16), accent, [0.08, 0.88, 0]);
    helmet.scale.y = 1.05;
    const visor = mesh(new THREE.SphereGeometry(0.173, 20, 10, Math.PI / 2, Math.PI), carbon, [0.05, 0.89, 0]);
    visor.scale.y = 0.34;
    const haloCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.38, 0.92, -0.3), new THREE.Vector3(-0.3, 1.03, -0.29),
        new THREE.Vector3(-0.61, 1.01, 0), new THREE.Vector3(-0.3, 1.03, 0.29), new THREE.Vector3(0.38, 0.92, 0.3),
    ]);
    mesh(new THREE.TubeGeometry(haloCurve, 32, 0.033, 8, false), carbon);
    rod([-0.61, 1.01, 0], [-0.73, 0.74, 0], 0.027);
    box([0.08, 0.08, 0.16], [1.96, 0.37, 0], new THREE.MeshStandardMaterial({ color: "#f5222f", emissive: "#f5222f", emissiveIntensity: 2 }));

    function decal(text, width, height, position, rotation) {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.font = "italic 900 78px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(String(text).toUpperCase(), 256, 68, 490);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide });
        const part = mesh(new THREE.PlaneGeometry(width, height), material, position);
        part.rotation.set(...rotation);
    }
    decal(livery.name, 1.15, 0.23, [0.58, 0.5, 0.855], [0, 0, 0]);
    decal(livery.name, 1.15, 0.23, [0.58, 0.5, -0.855], [0, Math.PI, 0]);
    decal(number, 0.45, 0.24, [-1.3, 0.765, 0], [-Math.PI / 2, 0, -Math.PI / 2]);

    return { group, wheels };
}

export function disposeObject(object) {
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    object.traverse((part) => {
        if (part.geometry) geometries.add(part.geometry);
        if (part.material) {
            for (const material of Array.isArray(part.material) ? part.material : [part.material]) {
                materials.add(material);
                for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
            }
        }
    });
    textures.forEach((texture) => texture.dispose());
    materials.forEach((material) => material.dispose());
    geometries.forEach((geometry) => geometry.dispose());
}
