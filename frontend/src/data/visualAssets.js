export function driverPortrait(driver) {
    const surname = String(driver?.surname ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return `${import.meta.env.BASE_URL}drivers/${surname}_${driver?.number}.avif`;
}
