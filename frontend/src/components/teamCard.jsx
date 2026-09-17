import { useState } from "react";
import FlagBadge from "./ui/FlagBadge";
import Button from "./ui/Button";
import { getTeamLivery } from "../data/teamLiveries";
import { useRacePresentation } from "./presentation/RacePresentation";
import TeamLogo from "./ui/TeamLogo";

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

export default function TeamCard({ team, isSelected, onSelect, onPreview, drivers = [], extra = null }) {
    const [open, setOpen] = useState(false);
    const present = useRacePresentation();

    const teamName = team?.name ?? "Team";
    const style = TEAM_STYLE[teamName] || "border-f1-border shadow-black/0";
    const accent = getTeamLivery(teamName).color;

    const shortName = extra?.shortName ?? teamName;
    const debut = extra?.debutF1 ?? "—";
    const cstr = extra?.constructorTitles ?? 0;
    const selectedLabel = isSelected ? "Selectionnee" : "Selectionner";

    const handleKeyDown = (e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.();
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${selectedLabel} ${shortName}`}
            onClick={onSelect}
            onKeyDown={handleKeyDown}
            onPointerEnter={() => onPreview?.(team)}
            onPointerLeave={() => onPreview?.(null)}
            onFocus={() => onPreview?.(team)}
            onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) onPreview?.(null); }}
            style={{
                "--team-accent": accent,
                "--team-glow": `${accent}40`,
                "--team-soft": `${accent}24`,
            }}
            className={[
                "f1-team-card rounded-2xl overflow-hidden border-2 bg-f1-surface cursor-pointer transition-all duration-200 outline-none f1-motion-card",
                "focus-visible:ring-2 focus-visible:ring-f1-red focus-visible:ring-offset-2 focus-visible:ring-offset-f1-dark",
                isSelected
                    ? `is-selected ${style} bg-f1-surface-2`
                    : "border-f1-border",
            ].join(" ")}
        >
            {/* Logo header */}
            <div className="team-logo-panel relative z-10 w-full h-36 flex items-center justify-center" style={{ background: `color-mix(in srgb, ${accent} 7%, #f5f6f8)`, borderBottom: `4px solid ${accent}` }}>
                <TeamLogo team={team} className="h-28 w-40 object-contain" />
            </div>

            <div className="relative z-10 p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="font-f1-display font-bold uppercase text-base leading-tight text-f1-white">
                        {shortName}
                    </div>
                    {isSelected && (
                        <span className="rounded-full border border-f1-red/40 bg-f1-red/15 px-2 py-0.5 text-[10px] font-bold text-f1-red">
                            Choisie
                        </span>
                    )}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge>Drivers: {drivers.length}</Badge>
                    <Badge>CSTR: {cstr}</Badge>
                    <Badge>Debut: {debut}</Badge>
                </div>

                {extra?.highlight && (
                    <div className="mt-3 text-sm text-f1-silver leading-snug">
                        <span className="text-f1-muted">Résumé : </span>
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
                        if (open) setOpen(false);
                        else present({ team }, () => setOpen(true));
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
                                Informations detaillees indisponibles pour cette ecurie.
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
                                        <div className="text-sm text-f1-white font-semibold flex items-center gap-2 min-w-0">
                                            <FlagBadge country={d.country} compact />
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
