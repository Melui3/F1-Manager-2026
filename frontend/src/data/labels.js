// ─── Types de session ────────────────────────────────────────────────────────
export const SESSION_LABEL = {
    FP: "Essais Libres",
    QC: "Qualifications",
    QS: "Qualif. Sprint",
    S:  "Sprint",
    GP: "Grand Prix",
};

export const SESSION_SHORT = {
    FP: "EL",
    QC: "Q",
    QS: "QS",
    S:  "S",
    GP: "GP",
};

// ─── Drapeaux pays (emoji) ────────────────────────────────────────────────────
export const COUNTRY_FLAG = {
    // Pilotes 2026
    Monaco:  "🇲🇨",
    UK:      "🇬🇧",
    NED:     "🇳🇱",
    FRA:     "🇫🇷",
    ITA:     "🇮🇹",
    AUS:     "🇦🇺",
    CAN:     "🇨🇦",
    ESP:     "🇪🇸",
    ARG:     "🇦🇷",
    GER:     "🇩🇪",
    BRA:     "🇧🇷",
    MEX:     "🇲🇽",
    FIN:     "🇫🇮",
    THA:     "🇹🇭",
    SWE:     "🇸🇪",
};

// ─── Couleurs équipes (Tailwind border/text) ──────────────────────────────────
export const TEAM_COLOR = {
    "Oracle Red Bull Racing":                 { border: "border-blue-500",    text: "text-blue-400",    dot: "bg-blue-500"    },
    "Scuderia Ferrari HP":                    { border: "border-red-500",     text: "text-red-400",     dot: "bg-red-500"     },
    "Mercedes-AMG Petronas Formula One Team": { border: "border-emerald-400", text: "text-emerald-400", dot: "bg-emerald-400" },
    "McLaren Mastercard Formula 1 Team":      { border: "border-orange-400",  text: "text-orange-400",  dot: "bg-orange-400"  },
    "Aston Martin Aramco Formula One Team":   { border: "border-emerald-500", text: "text-emerald-500", dot: "bg-emerald-500" },
    "BWT Alpine F1 Team":                     { border: "border-sky-400",     text: "text-sky-400",     dot: "bg-sky-400"     },
    "Audi F1 Team (Revolut)":                 { border: "border-zinc-300",    text: "text-zinc-300",    dot: "bg-zinc-300"    },
    "Cadillac Formula One Team":              { border: "border-yellow-400",  text: "text-yellow-400",  dot: "bg-yellow-400"  },
    "TGR Hass F1 Team":                       { border: "border-gray-300",    text: "text-gray-300",    dot: "bg-gray-300"    },
    "Atlassian Williams Racing":              { border: "border-sky-500",     text: "text-sky-400",     dot: "bg-sky-500"     },
    "Visa Cash App Racing Bulls F1 Team":     { border: "border-indigo-400",  text: "text-indigo-400",  dot: "bg-indigo-400"  },
};

// ─── Podium ───────────────────────────────────────────────────────────────────
export const PODIUM_STYLE = {
    1: { ring: "border-yellow-400/50  bg-yellow-400/10",  text: "text-yellow-400",  rank: "🥇" },
    2: { ring: "border-gray-300/50    bg-gray-300/10",    text: "text-gray-300",    rank: "🥈" },
    3: { ring: "border-amber-600/50   bg-amber-600/10",   text: "text-amber-500",   rank: "🥉" },
};
