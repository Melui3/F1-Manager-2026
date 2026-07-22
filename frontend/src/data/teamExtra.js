// src/data/teamExtra.js
// Clés = EXACTEMENT les strings de team.name (backend).
// Si un nom change dans l’API, tu ajustes ici.

export const TEAM_EXTRA = {
    "Oracle Red Bull Racing": {
        shortName: "Red Bull",
        base: "Milton Keynes (UK)",
        teamPrincipal2026: "Laurent Mekies",
        powerUnit2026: "RBPT Ford",
        debutF1: 2005,
        constructorTitles: 6,
        driverTitles: 7,
        highlight: "Equipe de pointe, forte en performance pure, ideale si tu veux viser vite les victoires.",
        notes: ["Titres constructeurs: 2010–2013, 2022–2023"],
    },

    "Scuderia Ferrari HP": {
        shortName: "Ferrari",
        base: "Maranello (Italie)",
        teamPrincipal2026: "Frédéric Vasseur",
        powerUnit2026: "Ferrari",
        debutF1: 1950,
        constructorTitles: 16,
        driverTitles: 15,
        highlight: "Ecurie historique avec gros potentiel, mais chaque resultat est attendu au plus haut niveau.",
        notes: ["Équipe la plus titrée côté constructeurs (record)."],
    },

    "Mercedes-AMG Petronas Formula One Team": {
        shortName: "Mercedes",
        base: "Brackley (UK)",
        teamPrincipal2026: "Toto Wolff",
        powerUnit2026: "Mercedes",
        debutF1: 1954,
        constructorTitles: 8,
        driverTitles: 9,
        highlight: "Structure tres solide, bon choix pour construire une saison reguliere et efficace.",
        notes: ["Série de titres constructeurs 2014–2021 (8 d’affilée)."],
    },

    "McLaren Mastercard Formula 1 Team": {
        shortName: "McLaren",
        base: "Woking (UK)",
        teamPrincipal2026: "Andrea Stella",
        powerUnit2026: "Mercedes",
        debutF1: 1966,
        constructorTitles: 10,
        driverTitles: 12,
        highlight: "Package rapide et stable, parfait pour jouer le haut de tableau avec une marge de progression.",
        notes: ["Titres constructeurs listés incluant 2024 et 2025."],
    },

    "Aston Martin Aramco Formula One Team": {
        shortName: "Aston Martin",
        base: "Silverstone (UK)",
        teamPrincipal2026: "Adrian Newey",
        powerUnit2026: "Honda",
        debutF1: 1959,
        constructorTitles: 0,
        driverTitles: 0,
        highlight: "Projet ambitieux centre sur le developpement, interessant pour une progression sur la duree.",
        notes: ["Honda devient motoriste exclusif en 2026."],
    },

    "BWT Alpine F1 Team": {
        shortName: "Alpine",
        base: "Enstone (UK) / Viry-Châtillon (FR)",
        teamPrincipal2026: "Steve Nielsen",
        powerUnit2026: "Mercedes",
        debutF1: 1977,
        constructorTitles: 2,
        driverTitles: 2,
        highlight: "Equipe a fort potentiel, mais qui demande de stabiliser les performances course apres course.",
        notes: ["Renault quitte la F1 comme motoriste fin 2025, Alpine passe chez Mercedes en 2026."],
    },

    "Audi F1 Team (Revolut)": {
        shortName: "Audi",
        base: "Hinwil (CH) / Neubourg (DE)",
        teamPrincipal2026: "Jonathan Wheatley",
        powerUnit2026: "Audi",
        debutF1: 2026,
        constructorTitles: 0,
        driverTitles: 0,
        highlight: "Nouvelle structure officielle, ideale pour partir d'une base neuve et construire patiemment.",
        notes: ["Audi arrive en tant qu’équipe officielle (héritage Sauber)."],
    },

    "Cadillac Formula One Team": {
        shortName: "Cadillac",
        base: "Fishers / Charlotte / Warren (US) + Silverstone (UK)",
        teamPrincipal2026: "Graeme Lowdon",
        powerUnit2026: "Ferrari",
        debutF1: 2026,
        constructorTitles: 0,
        driverTitles: 0,
        highlight: "Nouvelle equipe americaine, bon defi si tu veux transformer un projet debutant en outsider.",
        notes: ["Nouvelle équipe: 11e team sur la grille en 2026."],
    },

    "TGR Hass F1 Team": {
        shortName: "Haas",
        base: "Kannapolis (US) / Banbury (UK)",
        teamPrincipal2026: "Ayao Komatsu",
        powerUnit2026: "Ferrari",
        debutF1: 2016,
        constructorTitles: 0,
        driverTitles: 0,
        highlight: "Ecurie pragmatique, efficace pour chercher des opportunites avec un budget maitrise.",
        notes: ["Sponsor-titre Toyota Gazoo Racing en 2026 (dénomination)."],
    },

    "Atlassian Williams Racing": {
        shortName: "Williams",
        base: "Grove (UK)",
        teamPrincipal2026: "James Vowles",
        powerUnit2026: "Mercedes",
        debutF1: 1977,
        constructorTitles: 9,
        driverTitles: 7,
        highlight: "Grand nom en reconstruction, bon choix pour viser une remontee progressive au classement.",
        notes: ["3e équipe la plus titrée constructeurs (9)."],
    },

    "Visa Cash App Racing Bulls F1 Team": {
        shortName: "Racing Bulls",
        base: "Faenza (Italie) / Milton Keynes (UK)",
        teamPrincipal2026: "Alan Permane",
        powerUnit2026: "RBPT Ford",
        debutF1: 2006,
        constructorTitles: 0,
        driverTitles: 0,
        highlight: "Equipe agile et formatrice, adaptee aux paris jeunes pilotes et aux coups strategiques.",
        notes: ["Équipe sœur Red Bull (même PU RBPT Ford en 2026)."],
    },
};

export function getTeamExtra(teamName) {
    return TEAM_EXTRA?.[teamName] ?? null;
}
