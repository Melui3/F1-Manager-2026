import React, { useState } from "react";

const TEAM_KEY_MAP = {
    "Oracle Red Bull Racing": "redbull",
    "Scuderia Ferrari HP": "ferrari",
    "Mercedes-AMG Petronas Formula One Team": "mercedes",
    "McLaren Mastercard Formula 1 Team": "mclaren",
    "Aston Martin Aramco Formula One Team": "astonmartin",
    "BWT Alpine F1 Team": "alpine",
    "Audi F1 Team (Revolut)": "audi",
    "Cadillac Formula One Team": "cadillac",
    "TGR Hass F1 Team": "haas",
    "Atlassian Williams Racing": "williams",
    "Visa Cash App Racing Bulls F1 Team": "racingbulls",
};

const TEAM_STYLE = {
    "Oracle Red Bull Racing": "border-blue-500/60 shadow-blue-500/20",
    "Scuderia Ferrari HP": "border-red-500/70 shadow-red-500/20",
    "Mercedes-AMG Petronas Formula One Team": "border-emerald-400/60 shadow-emerald-400/20",
    "McLaren Mastercard Formula 1 Team": "border-orange-400/70 shadow-orange-400/20",
    "Aston Martin Aramco Formula One Team": "border-emerald-500/60 shadow-emerald-500/20",
    "BWT Alpine F1 Team": "border-sky-400/60 shadow-sky-400/20",
    "Audi F1 Team (Revolut)": "border-zinc-200/40 shadow-zinc-200/10",
    "Cadillac Formula One Team": "border-yellow-400/60 shadow-yellow-400/20",
    "TGR Hass F1 Team": "border-gray-200/40 shadow-gray-200/10",
    "Atlassian Williams Racing": "border-sky-500/60 shadow-sky-500/20",
    "Visa Cash App Racing Bulls F1 Team": "border-indigo-400/60 shadow-indigo-400/20",
};

function Badge({ children }) {
    return (
        <span className="text-[11px] px-2 py-1 rounded-full border border-gray-600 bg-gray-900/30 text-gray-200">
      {children}
    </span>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between gap-3">
            <span className="text-gray-400">{label}</span>
            <span className="font-semibold text-right text-gray-200">{value ?? "—"}</span>
        </div>
    );
}

export default function TeamCard({ team, isSelected, onSelect, drivers = [], extra = null }) {
    const [open, setOpen] = useState(false);
    const base = import.meta.env.BASE_URL;

    const teamName = team?.name ?? "Team";
    const teamKey = TEAM_KEY_MAP[teamName] || team?.team_key || null;

    const style = TEAM_STYLE[teamName] || "border-gray-700 shadow-black/0";

    // ✅ GH Pages safe + ✅ no default image
    const logoSrc = teamKey ? `${base}teams/${teamKey}.avif` : null;

    const shortName = extra?.shortName ?? teamName;
    const debut = extra?.debutF1 ?? "—";
    const cstr = extra?.constructorTitles ?? 0;

    return (
        <div
            onClick={onSelect}
            className={`rounded-2xl overflow-hidden border-2 bg-gray-800 cursor-pointer transition-all
        ${isSelected ? `${style} shadow-2xl bg-gray-700/70` : "border-gray-700 hover:shadow-lg hover:border-gray-500"}
      `}
        >
            {/* header */}
            <div className="w-full h-32 bg-gray-900 flex items-center justify-center">
                {logoSrc ? (
                    <img
                        src={logoSrc}
                        alt={teamName}
                        className="h-20 w-20 object-contain"
                        onError={(e) => e.currentTarget.remove()}
                    />
                ) : (
                    <div className="text-xs text-gray-500">Logo non disponible</div>
                )}
            </div>

            <div className="p-4">
                <div className="text-white font-extrabold uppercase text-lg leading-tight">{shortName}</div>

                <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>Drivers: {drivers.length}</Badge>
                    <Badge>CSTR: {cstr}</Badge>
                    <Badge>Debut: {debut}</Badge>
                </div>

                {extra?.highlight && (
                    <div className="mt-3 text-sm text-gray-200 leading-snug">
                        <span className="text-gray-400">À retenir : </span>
                        {extra.highlight}
                    </div>
                )}

                <button
                    type="button"
                    className="mt-4 w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold py-2 transition"
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen((v) => !v);
                    }}
                >
                    {open ? "Masquer détails" : "Afficher détails"}
                </button>

                {open && (
                    <div className="mt-3 rounded-xl bg-gray-900 border border-gray-700 p-3">
                        <div className="text-xs text-gray-400 mb-2">Infos team</div>

                        {extra ? (
                            <div className="flex flex-col gap-1.5 text-sm">
                                <Row label="Nom complet" value={teamName} />
                                <Row label="Base" value={extra.base} />
                                <Row label="Team Principal (2026)" value={extra.teamPrincipal2026} />
                                <Row label="Power Unit (2026)" value={extra.powerUnit2026} />
                                <Row label="Début en F1" value={extra.debutF1} />
                                <Row label="Titres constructeurs" value={extra.constructorTitles ?? 0} />
                                <Row label="Titres pilotes" value={extra.driverTitles ?? 0} />

                                {Array.isArray(extra.notes) && extra.notes.length > 0 && (
                                    <div className="mt-2 rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                                        <div className="text-xs text-gray-400 mb-1">Notes</div>
                                        <ul className="list-disc pl-5 text-gray-300 text-sm space-y-1">
                                            {extra.notes.map((n, i) => (
                                                <li key={i}>{n}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-300">
                                Pas d’infos manuelles pour cette team. (Ajoute-la dans <b>teamExtra.js</b>)
                            </div>
                        )}

                        <div className="mt-3 text-xs text-gray-400 mb-2">Pilotes disponibles</div>

                        {drivers.length ? (
                            <div className="flex flex-col gap-2">
                                {drivers.map((d) => (
                                    <div
                                        key={`${d.surname}_${d.number}`}
                                        className="flex items-center justify-between rounded-lg bg-gray-800 border border-gray-700 px-3 py-2"
                                    >
                                        <div className="text-sm text-white font-semibold">
                                            {d.name} {d.surname}
                                        </div>
                                        <div className="text-sm text-gray-300">#{d.number}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-300">Aucun pilote</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}