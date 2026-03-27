import { useState } from "react";
import Button from "./ui/Button";

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
        <span className="text-[11px] px-2 py-0.5 rounded-full border border-f1-border bg-f1-dark/60 text-f1-silver">
            {children}
        </span>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between gap-3">
            <span className="text-f1-muted">{label}</span>
            <span className="font-semibold text-right text-f1-white">{value ?? "—"}</span>
        </div>
    );
}

export default function TeamCard({ team, isSelected, onSelect, drivers = [], extra = null }) {
    const [open, setOpen] = useState(false);
    const base = import.meta.env.BASE_URL;

    const teamName = team?.name ?? "Team";
    const teamKey = TEAM_KEY_MAP[teamName] || team?.team_key || null;
    const style = TEAM_STYLE[teamName] || "border-f1-border shadow-black/0";
    const logoSrc = teamKey ? `${base}teams/${teamKey}.avif` : null;

    const shortName = extra?.shortName ?? teamName;
    const debut = extra?.debutF1 ?? "—";
    const cstr = extra?.constructorTitles ?? 0;

    return (
        <div
            onClick={onSelect}
            className={[
                "rounded-2xl overflow-hidden border-2 bg-f1-surface cursor-pointer transition-all duration-200",
                isSelected
                    ? `${style} shadow-2xl bg-f1-surface-2`
                    : "border-f1-border hover:shadow-lg hover:border-f1-muted",
            ].join(" ")}
        >
            {/* Logo header */}
            <div className="w-full h-32 bg-f1-dark flex items-center justify-center">
                {logoSrc ? (
                    <img
                        src={logoSrc}
                        alt={teamName}
                        className="h-20 w-20 object-contain"
                        onError={(e) => e.currentTarget.remove()}
                    />
                ) : (
                    <div className="text-xs text-f1-muted">Logo non disponible</div>
                )}
            </div>

            <div className="p-4">
                <div className="font-f1-display font-bold uppercase text-base leading-tight text-f1-white">
                    {shortName}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge>Drivers: {drivers.length}</Badge>
                    <Badge>CSTR: {cstr}</Badge>
                    <Badge>Debut: {debut}</Badge>
                </div>

                {extra?.highlight && (
                    <div className="mt-3 text-sm text-f1-silver leading-snug">
                        <span className="text-f1-muted">À retenir : </span>
                        {extra.highlight}
                    </div>
                )}

                <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    className="mt-4"
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen((v) => !v);
                    }}
                >
                    {open ? "Masquer détails" : "Afficher détails"}
                </Button>

                {open && (
                    <div className="mt-3 rounded-xl bg-f1-dark border border-f1-border p-3 f1-fade-in">
                        <div className="f1-label mb-2">Infos team</div>

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
                                    <div className="mt-2 rounded-xl border border-f1-border bg-f1-surface-2/40 p-3">
                                        <div className="f1-label mb-1">Notes</div>
                                        <ul className="list-disc pl-5 text-f1-silver text-sm space-y-1">
                                            {extra.notes.map((n, i) => (
                                                <li key={i}>{n}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-sm text-f1-silver">
                                Pas d'infos manuelles pour cette team. (Ajoute-la dans <b>teamExtra.js</b>)
                            </div>
                        )}

                        <div className="f1-label mt-3 mb-2">Pilotes disponibles</div>

                        {drivers.length ? (
                            <div className="flex flex-col gap-1.5">
                                {drivers.map((d) => (
                                    <div
                                        key={`${d.surname}_${d.number}`}
                                        className="flex items-center justify-between rounded-lg bg-f1-surface border border-f1-border px-3 py-2"
                                    >
                                        <div className="text-sm text-f1-white font-semibold">
                                            {d.name} {d.surname}
                                        </div>
                                        <div className="text-sm text-f1-silver font-f1-display">#{d.number}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-f1-silver">Aucun pilote</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
