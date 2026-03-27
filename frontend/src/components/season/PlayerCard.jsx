import { useNavigate } from "react-router-dom";
import { useGame } from "../../context/GameContext";
import Button from "../ui/Button";
import { TEAM_COLOR, PODIUM_STYLE, COUNTRY_FLAG } from "../../data/labels";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function driverImgSrc(d) {
    const base = import.meta.env.BASE_URL || "/";
    const surname = d?.surname ?? "";
    const number = d?.number ?? "";
    if (!surname || number === "") return null;
    return `${base}drivers/${String(surname).toLowerCase()}_${number}.avif`;
}

function teamLogoSrc(teamName) {
    const base = import.meta.env.BASE_URL || "/";
    const key = TEAM_KEY_MAP[teamName];
    return key ? `${base}teams/${key}.avif` : null;
}

const clean = (s) =>
    String(s ?? "").trim().toLowerCase().normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");

const getNumber = (x) => {
    const n = Number(String(x ?? "").trim());
    return Number.isFinite(n) ? n : null;
};

const isSameDriver = (a, b) => {
    const aSurname = clean(a?.surname ?? a?.last_name);
    const bSurname = clean(b?.surname ?? b?.last_name);
    const aNum = getNumber(a?.number ?? a?.driver_number);
    const bNum = getNumber(b?.number ?? b?.driver_number);
    return !!aSurname && !!bSurname && aSurname === bSurname && aNum !== null && aNum === bNum;
};

// ─── StatCell / StatsGrid ─────────────────────────────────────────────────────

function StatCell({ label, value, delta }) {
    const d = typeof delta === "number" ? delta : null;
    const deltaTxt = d === null ? null : d > 0 ? `+${d}` : `${d}`;

    return (
        <div className="rounded-xl border border-f1-border bg-f1-dark/50 p-3">
            <div className="text-[10px] text-f1-muted uppercase tracking-wider">{label}</div>
            <div className="flex items-baseline justify-between gap-2 mt-0.5">
                <div className="font-f1-display text-sm font-bold text-f1-white">{value ?? "—"}</div>
                {deltaTxt !== null && deltaTxt !== "0" && (
                    <div className={`text-xs font-bold ${d > 0 ? "text-emerald-400" : "text-f1-red"}`}>
                        {deltaTxt}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatsGrid({ stats, prevStats }) {
    if (!stats) return <div className="text-sm text-f1-silver">Stats indisponibles.</div>;

    const delta = (k) =>
        typeof stats?.[k] === "number" && typeof prevStats?.[k] === "number"
            ? stats[k] - prevStats[k]
            : null;

    return (
        <div className="grid grid-cols-3 gap-2">
            <StatCell label="Speed"       value={stats.speed}       delta={delta("speed")} />
            <StatCell label="Racing"      value={stats.racing}      delta={delta("racing")} />
            <StatCell label="Reaction"    value={stats.reaction}    delta={delta("reaction")} />
            <StatCell label="Experience"  value={stats.experience}  delta={delta("experience")} />
            <StatCell label="Consistency" value={stats.consistency} delta={delta("consistency")} />
            <StatCell label="Error rate"  value={stats.error_rate}  delta={delta("error_rate")} />
            <StatCell label="Street"      value={stats.street}      delta={delta("street")} />
            <StatCell label="High speed"  value={stats.high}        delta={delta("high")} />
            <StatCell label="Wet"         value={stats.wet}         delta={delta("wet")} />
        </div>
    );
}

// ─── Leaderboard row ──────────────────────────────────────────────────────────

function LeaderRow({ d, rank, isPlayer }) {
    const podium = PODIUM_STYLE[rank];
    const teamColor = TEAM_COLOR[d?.team];

    return (
        <div
            className={[
                "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm",
                isPlayer
                    ? "border-f1-red/40 bg-f1-red/5 font-semibold"
                    : podium
                        ? `${podium.ring} font-medium`
                        : "border-f1-border bg-f1-dark/40",
            ].join(" ")}
        >
            {podium ? (
                <span className={`font-f1-display text-xs font-bold w-5 text-center ${podium.text}`}>
                    {podium.rank}
                </span>
            ) : (
                <span className="font-f1-display text-xs text-f1-muted w-5 text-center">{rank}</span>
            )}

            {d?.country && (
                <span className="text-sm">{COUNTRY_FLAG[d.country] ?? ""}</span>
            )}

            <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${teamColor?.dot ?? "bg-f1-muted"}`} />

            <span className={`flex-1 truncate text-xs ${isPlayer ? "text-f1-white" : podium ? podium.text : "text-f1-silver"}`}>
                {d?.name} <span className="uppercase font-semibold">{d?.surname}</span>
                {isPlayer && (
                    <span className="ml-1.5 text-[9px] font-bold text-f1-red bg-f1-red/15 px-1 py-0.5 rounded-full">TOI</span>
                )}
            </span>

            {(d?.wins ?? 0) > 0 && (
                <span className="text-[9px] font-bold text-f1-yellow bg-f1-yellow/10 px-1 py-0.5 rounded-full shrink-0">
                    {d.wins}W
                </span>
            )}

            <span className="font-f1-display text-xs font-bold text-f1-white tabular-nums shrink-0">
                {d?.points ?? 0}
            </span>
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlayerCard({
    driver,
    team,
    teamBorder,
    playerPoints,
    playerStats,
    prevPlayerStats,
    isBusy,
    driversBoard,
    wdcLoading,
    onReset,
    onOpenWdc,
    budget,
}) {
    const navigate = useNavigate();
    const { setTeam, setDriver } = useGame();

    return (
        <aside className="w-full lg:w-[360px] flex flex-col gap-5 lg:sticky lg:top-6 h-fit">
            {/* Driver / team card */}
            <div className={`bg-f1-surface border-2 rounded-2xl p-5 shadow-lg flex flex-col items-center gap-4 ${teamBorder}`}>
                <Button
                    variant="secondary"
                    fullWidth
                    disabled={isBusy}
                    onClick={() => {
                        setDriver(null);
                        setTeam(null);
                        navigate("/choose-team");
                    }}
                >
                    Refaire les choix
                </Button>

                <img
                    src={driverImgSrc(driver)}
                    alt={`${driver.name} ${driver.surname}`}
                    className="h-28 w-28 rounded-full border-2 border-f1-red object-cover object-top"
                    onError={(e) => e.currentTarget.remove()}
                />

                <div className="text-center">
                    <div className="font-f1-display font-bold text-base text-f1-white">
                        {driver.name} {driver.surname}
                    </div>
                    <div className="font-f1-display text-f1-red text-sm mt-0.5">#{driver.number}</div>
                </div>

                <div className="flex items-center gap-2 text-sm text-f1-silver">
                    <img
                        src={teamLogoSrc(team.name)}
                        alt={team.name}
                        className="h-5 w-5 object-contain"
                        onError={(e) => e.currentTarget.remove()}
                    />
                    <span>{team.name}</span>
                </div>

                <div className="w-full rounded-xl bg-f1-dark/60 border border-f1-border p-4 text-center">
                    <div className="f1-label">Points WDC</div>
                    <div className="font-f1-display text-4xl font-black text-f1-white mt-1">{playerPoints}</div>
                </div>

                <div className="w-full rounded-xl bg-f1-dark/60 border border-f1-border p-4 text-center">
                    <div className="f1-label">Budget</div>
                    <div className="font-f1-display text-2xl font-black text-f1-yellow mt-1">
                        {budget != null ? `${(budget / 1_000_000).toFixed(0)}M` : "—"}
                    </div>
                </div>

                <div className="w-full rounded-xl bg-f1-dark/60 border border-f1-border p-4">
                    <div className="f1-label mb-3">Stats pilote</div>
                    <StatsGrid stats={playerStats} prevStats={prevPlayerStats} />
                </div>

                <Button variant="danger" fullWidth disabled={isBusy} onClick={onReset}>
                    Reset saison
                </Button>
            </div>

            {/* Leaderboard */}
            <div className="bg-f1-surface border border-f1-border rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-f1-display text-sm font-bold tracking-widest text-f1-red uppercase">
                        Leaderboard
                    </h2>
                    <Button
                        variant="secondary"
                        size="sm"
                        loading={wdcLoading}
                        disabled={wdcLoading}
                        onClick={onOpenWdc}
                    >
                        WDC complet
                    </Button>
                </div>

                {driversBoard.length === 0 ? (
                    <div className="text-f1-muted text-sm">Aucun pilote dans le classement.</div>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        {driversBoard.map((d, idx) => (
                            <LeaderRow
                                key={`${d.surname}_${d.number}`}
                                d={d}
                                rank={idx + 1}
                                isPlayer={isSameDriver(d, driver)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}
