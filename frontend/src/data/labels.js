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

// ─── Codes pays stables pour les badges ───────────────────────────────────────
export const COUNTRY_CODE = {
    Monaco: "MON",
    UK: "GBR",
    NED: "NED",
    FRA: "FRA",
    ITA: "ITA",
    AUS: "AUS",
    CAN: "CAN",
    ESP: "ESP",
    ARG: "ARG",
    GER: "GER",
    BRA: "BRA",
    MEX: "MEX",
    FIN: "FIN",
    THA: "THA",
    SWE: "SWE",
};

export const GP_COUNTRY_CODE = {
    "Australian GP": "AUS",
    "Chinese GP": "CHN",
    "Japanese GP": "JPN",
    "Bahrain GP": "BHR",
    "Jeddah GP": "SAU",
    "Miami GP": "USA",
    "Canadian GP": "CAN",
    "Monaco GP": "MON",
    "Barcelona GP": "ESP",
    "Austrian GP": "AUT",
    "British GP": "GBR",
    "Belgian GP": "BEL",
    "Hungarian GP": "HUN",
    "Dutch GP": "NED",
    "Italian GP": "ITA",
    "Spanish GP": "ESP",
    "Azerbaijan GP": "AZE",
    "Singapore GP": "SGP",
    "United States GP": "USA",
    "Mexico GP": "MEX",
    "Brazilian GP": "BRA",
    "Las Vegas GP": "USA",
    "Qatar GP": "QAT",
    "Abu Dhabi GP": "UAE",
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

// ─── GP country flags ─────────────────────────────────────────────────────────
export const GP_FLAG = {
    "Australian GP":    "🇦🇺",
    "Chinese GP":       "🇨🇳",
    "Japanese GP":      "🇯🇵",
    "Bahrain GP":       "🇧🇭",
    "Jeddah GP":        "🇸🇦",
    "Miami GP":         "🇺🇸",
    "Canadian GP":      "🇨🇦",
    "Monaco GP":        "🇲🇨",
    "Barcelona GP":     "🇪🇸",
    "Austrian GP":      "🇦🇹",
    "British GP":       "🇬🇧",
    "Belgian GP":       "🇧🇪",
    "Hungarian GP":     "🇭🇺",
    "Dutch GP":         "🇳🇱",
    "Italian GP":       "🇮🇹",
    "Spanish GP":       "🇪🇸",
    "Azerbaijan GP":    "🇦🇿",
    "Singapore GP":     "🇸🇬",
    "United States GP": "🇺🇸",
    "Mexico GP":        "🇲🇽",
    "Brazilian GP":     "🇧🇷",
    "Las Vegas GP":     "🇺🇸",
    "Qatar GP":         "🇶🇦",
    "Abu Dhabi GP":     "🇦🇪",
};

// ─── Circuit type icons ───────────────────────────────────────────────────────
export const CIRCUIT_ICON = {
    street:     "🏙️",
    high_speed: "⚡",
    wet:        "🌧️",
};

export const CIRCUIT_TYPE_META = {
    street: {
        label: "Circuit urbain",
        description: "Virages proches des murs, peu de marge d'erreur, l'agilite et la reaction comptent beaucoup.",
    },
    high_speed: {
        label: "Circuit rapide",
        description: "Longues lignes droites et enchainements rapides, la vitesse et l'efficacite aero font la difference.",
    },
    wet: {
        label: "Conditions pluie",
        description: "Adherence reduite, la regularite et l'affinite pluie deviennent prioritaires.",
    },
};

export const GP_CIRCUIT_SUMMARY = {
    "Australian GP": "Albert Park alterne freinages moyens et relances rapides. Bon test d'equilibre entre vitesse et constance.",
    "Chinese GP": "Shanghai met l'accent sur les longues courbes et la motricite. Les voitures rapides y prennent vite l'avantage.",
    "Japanese GP": "Suzuka demande precision et rythme, avec des enchainements rapides qui punissent les erreurs.",
    "Bahrain GP": "Bahrain combine grosses zones de freinage et traction. La course use les pneus et valorise la regularite.",
    "Jeddah GP": "Jeddah est un urbain tres rapide. Reaction, confiance et faible taux d'erreur sont essentiels.",
    "Miami GP": "Miami melange sections urbaines, relances lentes et lignes droites. Une voiture polyvalente aide beaucoup.",
    "Canadian GP": "Montreal repose sur freinage, traction et vibreurs. Les pilotes propres limitent les pertes de temps.",
    "Monaco GP": "Monaco est le piege classique : depasser est difficile, la qualification et la precision priment.",
    "Barcelona GP": "Barcelone est tres complet. Il revele vite les forces et faiblesses globales d'une voiture.",
    "Austrian GP": "Le Red Bull Ring est court et rapide, avec peu de virages mais de gros freinages.",
    "British GP": "Silverstone favorise l'aero et le courage dans les courbes rapides. La vitesse pure compte fort.",
    "Belgian GP": "Spa combine longues pleines charges, deniveles et secteurs varies. Les meilleurs packages brillent.",
    "Hungarian GP": "Le Hungaroring est sinueux et technique. La regularite peut compenser un manque de vitesse de pointe.",
    "Dutch GP": "Zandvoort est fluide, rapide et exigeant. Les erreurs coutent cher dans les portions rapides.",
    "Italian GP": "Monza est le temple de la vitesse. La puissance et la faible trainee dominent.",
    "Spanish GP": "Madring est traite ici comme un circuit rapide moderne, bon pour juger vitesse et relances.",
    "Azerbaijan GP": "Baku oppose une tres longue ligne droite a un secteur urbain serre. Gros ecarts possibles.",
    "Singapore GP": "Singapour est lent, long et exigeant. Les pilotes constants et reactifs sont recompenses.",
    "United States GP": "COTA est varie : montees, virages rapides et freinages forts. Les voitures completes y sont solides.",
    "Mexico GP": "Mexico demande de l'efficacite en altitude et une bonne traction dans les sections lentes.",
    "Brazilian GP": "Interlagos est court, rythme et piegeux. Une bonne course peut vite changer le classement.",
    "Las Vegas GP": "Las Vegas est urbain mais tres rapide. La vitesse de pointe et les erreurs sous pression comptent.",
    "Qatar GP": "Losail enchaine les courbes rapides. L'aero et la constance sur relais longs sont importantes.",
    "Abu Dhabi GP": "Yas Marina est un final complet, entre relances, lignes droites et secteurs techniques.",
};
