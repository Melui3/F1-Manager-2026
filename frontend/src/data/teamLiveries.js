const LIVERIES = [
    { match: /ferrari/i, key: "ferrari", name: "Ferrari", color: "#ed1826", secondary: "#ffe04a", body: "#d80b19" },
    { match: /mclaren/i, key: "mclaren", name: "McLaren", color: "#ff8700", secondary: "#76d9ef", body: "#ff8700" },
    { match: /mercedes/i, key: "mercedes", name: "Mercedes", color: "#00dfbd", secondary: "#e0e4e6", body: "#a9b3b8" },
    { match: /red bull|redbull/i, key: "redbull", name: "Red Bull", color: "#477bff", secondary: "#ffd629", body: "#183878" },
    { match: /aston/i, key: "astonmartin", name: "Aston Martin", color: "#26c099", secondary: "#dcff52", body: "#087b64" },
    { match: /alpine/i, key: "alpine", name: "Alpine", color: "#32b4ff", secondary: "#ff8ac8", body: "#138edb" },
    { match: /audi|sauber/i, key: "audi", name: "Audi", color: "#ed4840", secondary: "#ff3830", body: "#c8ced1" },
    { match: /cadillac/i, key: "cadillac", name: "Cadillac", color: "#d6b45f", secondary: "#d6b45f", body: "#e1e4e5" },
    { match: /haas|hass/i, key: "haas", name: "Haas", color: "#e3e5e8", secondary: "#e4242e", body: "#e3e5e8" },
    { match: /williams/i, key: "williams", name: "Williams", color: "#42b8ff", secondary: "#f2f4f7", body: "#1766dc" },
    { match: /racing bulls|visa cash/i, key: "racingbulls", name: "Racing Bulls", color: "#7495ff", secondary: "#316bff", body: "#eceef2" },
];

export function getTeamLivery(team) {
    const name = typeof team === "object" && team !== null ? team.name : team;
    return LIVERIES.find((livery) => livery.match.test(String(name ?? ""))) ?? {
        key: "default", name: "F1 Manager", color: "#ef322b", secondary: "#f0f2f3", body: "#de2425",
    };
}
