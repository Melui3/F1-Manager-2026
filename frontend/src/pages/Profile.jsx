import { useEffect, useMemo, useRef, useState } from "react";
import {
    Activity,
    Download,
    Gauge,
    HardDrive,
    RefreshCw,
    RotateCcw,
    Settings2,
    ShieldCheck,
    Target,
    Trash2,
    Trophy,
    Upload,
    Zap,
} from "lucide-react";
import AvatarPicker from "../components/AvatarPicker.jsx";
import { useGame } from "../context/GameContext";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmModal from "../components/modals/ConfirmModal";
import { TEAM_COLOR, SESSION_LABEL } from "../data/labels";
import FlagBadge from "../components/ui/FlagBadge";
import {
    apiFetch,
    clearLocalSave,
    exportLocalSave,
    importLocalSave,
} from "../services/api";

const TRAINING_UPGRADES = [
    { stat: "speed",       label: "Vitesse",     desc: "+2 Speed",       cost: 7_000_000 },
    { stat: "racing",      label: "Course",      desc: "+2 Racing",      cost: 7_000_000 },
    { stat: "reaction",    label: "Reflexes",    desc: "+2 Reaction",    cost: 7_000_000 },
    { stat: "consistency", label: "Regularite",  desc: "+2 Consistency", cost: 5_000_000 },
    { stat: "experience",  label: "Experience",  desc: "+2 Experience",  cost: 5_000_000 },
];

const TEAM_UPGRADES = [
    { key: "aero",       label: "Aero",        desc: "Meilleure perf sur circuits rapides", baseCost: 8_000_000, Icon: Gauge },
    { key: "power_unit", label: "Power unit",  desc: "Vitesse de pointe et relances",       baseCost: 8_000_000, Icon: Zap },
    { key: "race_ops",   label: "Race ops",    desc: "Execution course et sprints",         baseCost: 6_000_000, Icon: Settings2 },
    { key: "reliability",label: "Fiabilite",   desc: "Moins de penalites et erreurs",       baseCost: 6_000_000, Icon: ShieldCheck },
];

const fmtMoney = (value) => {
    const millions = (Number(value) || 0) / 1_000_000;
    return `${millions >= 10 ? Math.round(millions) : millions.toFixed(1)}M`;
};
const clean = (s) => String(s ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");

function roundMoney(value) {
    return Math.round(value / 500_000) * 500_000;
}

function nextTeamUpgradeCost(item, level = 1) {
    const currentLevel = Math.max(1, Number(level) || 1);
    return roundMoney(item.baseCost * (1 + (currentLevel - 1) * 0.85 + Math.max(0, currentLevel - 2) * 0.35));
}

function cheapestProjectCost(upgrades = {}) {
    const costs = [
        ...TEAM_UPGRADES
            .filter((item) => (upgrades?.[item.key] || 1) < 5)
            .map((item) => nextTeamUpgradeCost(item, upgrades?.[item.key] || 1)),
        ...TRAINING_UPGRADES.map((item) => item.cost),
    ];
    return Math.min(...costs);
}

function StatBar({ label, value, max = 100 }) {
    const pct = Math.max(0, Math.min(100, Math.round(((value ?? 0) / max) * 100)));
    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="text-f1-muted uppercase tracking-wider">{label}</span>
                <span className="font-f1-display font-bold text-f1-white">{value ?? "-"}</span>
            </div>
            <div className="h-1.5 rounded-full bg-f1-dark/60 border border-f1-border overflow-hidden">
                <div className="h-full rounded-full bg-f1-red transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function MiniMetric({ label, value, tone = "text-f1-white" }) {
    return (
        <div className="f1-soft-panel rounded-xl p-4 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-f1-red/70" />
            <div className="text-[10px] uppercase tracking-wider text-f1-muted">{label}</div>
            <div className={`font-f1-display text-xl font-black mt-1 ${tone}`}>{value}</div>
        </div>
    );
}

function UpgradeButton({ item, level, cost, budget, loading, onClick }) {
    const canAfford = budget >= cost;
    const atMax = level >= 5;
    const disabled = loading || !canAfford || atMax;
    const Icon = item.Icon;
    const status = atMax ? "Projet termine" : canAfford ? "Pret a lancer" : `Manque ${fmtMoney(cost - budget)}`;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={[
                "rounded-xl border p-4 text-left transition-all min-h-36 f1-soft-panel",
                disabled
                    ? "border-f1-border/40 bg-f1-dark/20 opacity-55 cursor-not-allowed"
                    : "border-f1-border bg-f1-dark/45 hover:border-f1-red/50 hover:bg-f1-red/5",
            ].join(" ")}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="h-9 w-9 rounded-lg bg-f1-surface-2 border border-f1-border flex items-center justify-center">
                    <Icon className="h-4 w-4 text-f1-red" />
                </div>
                <span className="font-f1-display text-xs font-bold text-f1-yellow">{atMax ? "MAX" : fmtMoney(cost)}</span>
            </div>
            <div className="font-f1-display text-sm font-bold text-f1-white mt-3">{item.label}</div>
            <div className="text-xs text-f1-silver mt-1 leading-snug">{item.desc}</div>
            <div className="mt-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${i < level ? "bg-f1-red" : "bg-f1-border"}`}
                    />
                ))}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                <span className="text-f1-muted">Niveau {level}/5</span>
                <span className={canAfford && !atMax ? "text-emerald-400 font-bold" : "text-f1-muted"}>{status}</span>
            </div>
        </button>
    );
}

function ObjectiveRow({ icon, label, value, done }) {
    const ObjectiveIcon = icon;
    return (
        <div className="f1-soft-panel flex items-center gap-3 rounded-xl px-3 py-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${done ? "bg-emerald-500/10 text-emerald-400" : "bg-f1-surface-2 text-f1-silver"}`}>
                <ObjectiveIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-f1-white truncate">{label}</div>
                <div className="text-xs text-f1-muted">{value}</div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${done ? "bg-emerald-500/15 text-emerald-400" : "bg-f1-surface-2 text-f1-muted"}`}>
                {done ? "OK" : "A faire"}
            </span>
        </div>
    );
}

function GuideStep({ icon, title, children }) {
    const GuideIcon = icon;
    return (
        <div className="f1-soft-panel rounded-xl p-4">
            <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-f1-red/10 border border-f1-red/25 flex items-center justify-center">
                    <GuideIcon className="h-4 w-4 text-f1-red" />
                </div>
                <div className="font-f1-display text-xs font-bold uppercase tracking-widest text-f1-white">
                    {title}
                </div>
            </div>
            <p className="text-sm text-f1-silver leading-relaxed mt-3">{children}</p>
        </div>
    );
}

function buildWcc(drivers) {
    const map = {};
    for (const d of drivers) {
        const t = d.team ?? "-";
        if (!map[t]) map[t] = { team: t, points: 0, wins: 0 };
        map[t].points += d.points ?? 0;
        map[t].wins += d.wins ?? 0;
    }
    return Object.values(map).sort((a, b) => b.points - a.points || b.wins - a.wins);
}

export default function Profile() {
    const { userName, userAvatar, logout, driver, setDriver, team, sim, setSim } = useGame();
    const nav = useNavigate();
    const importInputRef = useRef(null);

    const [budget, setBudget] = useState(null);
    const [drivers, setDrivers] = useState([]);
    const [history, setHistory] = useState([]);
    const [teamUpgrades, setTeamUpgrades] = useState({});
    const [busy, setBusy] = useState(null);
    const [message, setMessage] = useState(null);
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [seasonResetConfirmOpen, setSeasonResetConfirmOpen] = useState(false);

    const playerDriver = useMemo(() => {
        if (!driver) return null;
        return drivers.find((d) => clean(d.surname) === clean(driver.surname) && Number(d.number) === Number(driver.number)) || driver;
    }, [drivers, driver]);

    const wdcRank = useMemo(() => {
        if (!playerDriver || !drivers.length) return null;
        const sorted = [...drivers].sort((a, b) => (b.points ?? 0) - (a.points ?? 0) || (b.wins ?? 0) - (a.wins ?? 0));
        const idx = sorted.findIndex((d) => clean(d.surname) === clean(playerDriver.surname) && Number(d.number) === Number(playerDriver.number));
        return idx >= 0 ? idx + 1 : null;
    }, [drivers, playerDriver]);

    const wccRank = useMemo(() => {
        if (!team || !drivers.length) return null;
        const idx = buildWcc(drivers).findIndex((entry) => clean(entry.team) === clean(team.name));
        return idx >= 0 ? idx + 1 : null;
    }, [drivers, team]);

    const teamColor = TEAM_COLOR[team?.name];
    const initials = (userName || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
    const averageUpgrade = TEAM_UPGRADES.reduce((sum, item) => sum + (teamUpgrades?.[item.key] || 1), 0) / TEAM_UPGRADES.length;
    const nextProjectCost = cheapestProjectCost(teamUpgrades);
    const budgetToProjectPct = Math.min(100, Math.round(((budget || 0) / nextProjectCost) * 100));
    const canLaunchProject = (budget || 0) >= nextProjectCost;

    const objectives = [
        { icon: Trophy, label: "Top 10 pilotes", value: wdcRank ? `Position actuelle P${wdcRank}` : "Classement non charge", done: !!wdcRank && wdcRank <= 10 },
        { icon: Target, label: "Top 5 constructeurs", value: wccRank ? `Ecurie P${wccRank}` : "Classement non charge", done: !!wccRank && wccRank <= 5 },
        { icon: HardDrive, label: "Financer un projet", value: budget == null ? "Budget non charge" : `${fmtMoney(budget)} / ${fmtMoney(nextProjectCost)}`, done: canLaunchProject },
        { icon: Activity, label: "R&D niveau 3 moyen", value: `Moyenne ${averageUpgrade.toFixed(1)}/5`, done: averageUpgrade >= 3 },
    ];

    async function refreshProfileData() {
        try {
            setMessage(null);
            const [budgetRes, driversRes, upgradesRes, historyRes] = await Promise.all([
                apiFetch("/api/season/budget/"),
                apiFetch("/api/drivers/"),
                team?.name
                    ? apiFetch(`/api/season/upgrades/?team=${encodeURIComponent(team.name)}`)
                    : Promise.resolve({ upgrades: {} }),
                apiFetch("/api/season/history/").catch(() => []),
            ]);
            const nextBudget = budgetRes?.budget ?? 0;
            const nextDrivers = Array.isArray(driversRes) ? driversRes : [];
            const nextUpgrades = upgradesRes?.upgrades || {};
            const nextHistory = Array.isArray(historyRes) ? historyRes : [];

            setBudget(nextBudget);
            setDrivers(nextDrivers);
            setTeamUpgrades(nextUpgrades);
            setHistory(nextHistory);

            return {
                budget: nextBudget,
                drivers: nextDrivers,
                upgrades: nextUpgrades,
                history: nextHistory,
            };
        } catch (e) {
            setMessage({ type: "error", text: e?.message || "Erreur de chargement du profil." });
            return null;
        }
    }

    useEffect(() => {
        refreshProfileData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [team?.name]);

    async function handleTrain(stat) {
        if (!playerDriver?.id || budget == null) return;
        setBusy(`train:${stat}`);
        try {
            const res = await apiFetch("/api/season/train/", {
                method: "POST",
                body: JSON.stringify({ driver_id: playerDriver.id, stat }),
            });
            setBudget(res.budget);
            setDriver({ ...playerDriver, ...res.driver });
            await refreshProfileData();
        } catch (e) {
            setMessage({ type: "error", text: e?.message || "Erreur entrainement." });
        } finally {
            setBusy(null);
        }
    }

    async function handleTeamUpgrade(upgrade) {
        if (!team?.name || budget == null) return;
        setBusy(`upgrade:${upgrade}`);
        try {
            const res = await apiFetch("/api/season/upgrades/", {
                method: "POST",
                body: JSON.stringify({ team_name: team.name, upgrade }),
            });
            setBudget(res.budget);
            setTeamUpgrades(res.upgrades || {});
        } catch (e) {
            setMessage({ type: "error", text: e?.message || "Upgrade impossible." });
        } finally {
            setBusy(null);
        }
    }

    function handleExport() {
        const payload = exportLocalSave();
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `f1-manager-2026-save-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage({ type: "success", text: "Sauvegarde exportee." });
    }

    async function handleImportFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const raw = await file.text();
            importLocalSave(JSON.parse(raw));
            window.location.reload();
        } catch (err) {
            setMessage({ type: "error", text: err?.message || "Import impossible." });
        } finally {
            e.target.value = "";
        }
    }

    function handleClearLocalSave() {
        setClearConfirmOpen(true);
    }

    async function confirmFullSeasonReset() {
        setBusy("season-reset");
        try {
            const res = await apiFetch("/api/season/reset/", {
                method: "POST",
                body: JSON.stringify({ full: true, advanceSeason: false, keepSeason: true }),
            });
            const refreshed = await refreshProfileData();
            const resetDriver = refreshed?.drivers?.find((d) =>
                clean(d.surname) === clean(driver?.surname) && Number(d.number) === Number(driver?.number)
            );

            if (resetDriver) setDriver(resetDriver);
            setSim((prev) => ({
                ...(prev || {}),
                season: res?.season ?? sim?.season ?? 2026,
                currentRound: 0,
                lastResults: null,
                standings: null,
            }));
            setSeasonResetConfirmOpen(false);
            setMessage({
                type: "success",
                text: "Saison reset completement : calendrier, resultats, budget, R&D, entrainement et historique remis a zero.",
            });
        } catch (e) {
            setMessage({ type: "error", text: e?.message || "Reset complet impossible." });
        } finally {
            setBusy(null);
        }
    }

    function confirmClearLocalSave() {
        clearLocalSave();
        logout();
        nav("/login");
    }

    return (
        <div className="p-5 md:p-8 max-w-screen-2xl mx-auto w-full f1-fade-in">
            <div className="mb-6 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
                <div>
                    <h1 className="font-f1-display text-3xl font-bold">
                        MON <span className="text-f1-red">EQUIPE</span>
                    </h1>
                    <p className="text-f1-silver text-sm mt-1">
                        Profil manager, R&D, entrainement et sauvegarde locale de la session active.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-f1-yellow/30 bg-f1-yellow/10 px-3 py-2 text-xs font-bold text-f1-yellow">
                        <HardDrive className="h-3.5 w-3.5" /> Sauvegarde locale
                    </span>
                    <Button variant="secondary" onClick={refreshProfileData}>
                        <RefreshCw className="h-4 w-4" /> Actualiser
                    </Button>
                </div>
            </div>

            {message && (
                <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${message.type === "error" ? "border-red-500/30 bg-red-950/30 text-red-300" : "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"}`}>
                    {message.text}
                </div>
            )}

            <Card stripe className="p-5 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                    <div>
                        <h2 className="font-f1-display text-base font-bold tracking-widest text-f1-red uppercase">
                            Comment utiliser Mon equipe
                        </h2>
                        <p className="text-sm text-f1-silver mt-2 leading-relaxed max-w-3xl">
                            Cet ecran sert de stand strategie entre deux courses. Le budget est volontairement rare :
                            chaque depense doit servir ton prochain objectif, pas tout debloquer d'un coup.
                        </p>
                    </div>
                    <div className="rounded-xl border border-f1-yellow/25 bg-f1-yellow/10 px-4 py-3 text-sm text-f1-yellow">
                        Tout ce qui est modifie ici impacte uniquement le manager actif.
                    </div>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3 f1-stagger">
                    <GuideStep icon={HardDrive} title="Budget">
                        Il augmente lentement avec les resultats en course. Tu choisis entre garder une reserve ou lancer un projet.
                    </GuideStep>
                    <GuideStep icon={Gauge} title="R&D ecurie">
                        Aero, moteur, operations et fiabilite donnent des bonus dans les prochaines simulations.
                    </GuideStep>
                    <GuideStep icon={Activity} title="Pilote">
                        L'entrainement augmente ses stats. Vitesse aide en qualif, course et constance aident sur GP et sprint.
                    </GuideStep>
                    <GuideStep icon={Target} title="Objectifs">
                        Les objectifs traduisent ta saison en priorites simples : classement, budget disponible et niveau de developpement.
                    </GuideStep>
                </div>
            </Card>

            <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
                <div className="flex flex-col gap-6">
                    <div className="grid md:grid-cols-4 gap-4 f1-stagger">
                        <MiniMetric label="Budget" value={budget == null ? "-" : fmtMoney(budget)} tone="text-f1-yellow" />
                        <MiniMetric label="WDC" value={wdcRank ? `P${wdcRank}` : "-"} />
                        <MiniMetric label="WCC" value={wccRank ? `P${wccRank}` : "-"} />
                        <MiniMetric label="R&D" value={`${averageUpgrade.toFixed(1)}/5`} tone="text-emerald-400" />
                    </div>

                    <Card className="p-5 f1-budget-hub">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                            <div className="min-w-0">
                                <div className="f1-label">Mur des stands</div>
                                <h2 className="font-f1-display text-xl font-black text-f1-white">
                                    Budget sous tension
                                </h2>
                                <p className="text-sm text-f1-silver mt-2 max-w-2xl leading-relaxed">
                                    Les primes de course financent un projet a la fois. Attends le bon moment :
                                    une R&D trop tot peut bloquer l'entrainement du pilote avant un Grand Prix cle.
                                </p>
                            </div>
                            <div className="rounded-xl border border-f1-yellow/25 bg-f1-yellow/10 px-4 py-3 min-w-52">
                                <div className="text-[10px] uppercase tracking-wider text-f1-muted">Prochain projet</div>
                                <div className="font-f1-display text-2xl font-black text-f1-yellow">{fmtMoney(nextProjectCost)}</div>
                                <div className={canLaunchProject ? "text-xs text-emerald-400 font-bold" : "text-xs text-f1-silver"}>
                                    {canLaunchProject ? "Financable maintenant" : `${fmtMoney(nextProjectCost - (budget || 0))} a trouver`}
                                </div>
                            </div>
                        </div>

                        <div className="mt-5">
                            <div className="flex items-center justify-between text-xs mb-2">
                                <span className="text-f1-muted uppercase tracking-wider">Cash disponible</span>
                                <span className="font-f1-display font-bold text-f1-white">{fmtMoney(budget)} / {fmtMoney(nextProjectCost)}</span>
                            </div>
                            <div className="h-3 rounded-full border border-f1-border bg-f1-dark overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-f1-red to-f1-yellow transition-all duration-700" style={{ width: `${budgetToProjectPct}%` }} />
                            </div>
                        </div>
                    </Card>

                    <Card stripe className="p-5">
                        <div className="flex items-center justify-between gap-4 mb-5">
                            <div>
                                <h2 className="font-f1-display text-sm font-bold tracking-widest text-f1-red uppercase">Projets R&D ecurie</h2>
                                <p className="text-xs text-f1-muted mt-1">Chaque niveau coute plus cher que le precedent et influence les prochaines simulations.</p>
                            </div>
                            <div className="font-f1-display font-bold text-f1-yellow">{budget == null ? "-" : fmtMoney(budget)}</div>
                        </div>

                        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 f1-stagger">
                            {TEAM_UPGRADES.map((item) => {
                                const level = teamUpgrades?.[item.key] || 1;
                                return (
                                    <UpgradeButton
                                        key={item.key}
                                        item={item}
                                        level={level}
                                        cost={nextTeamUpgradeCost(item, level)}
                                        budget={budget || 0}
                                        loading={busy === `upgrade:${item.key}`}
                                        onClick={() => handleTeamUpgrade(item.key)}
                                    />
                                );
                            })}
                        </div>
                    </Card>

                    {playerDriver && (
                        <Card className="p-5">
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="lg:w-64 shrink-0">
                                    <div className="f1-label mb-3">Pilote choisi</div>
                                    <div className="font-f1-display text-5xl font-black text-f1-red">#{playerDriver.number}</div>
                                    <div className="font-f1-display text-lg font-bold text-f1-white mt-2">
                                        {playerDriver.name} <span className="uppercase">{playerDriver.surname}</span>
                                    </div>
                                    {playerDriver.country && <div className="mt-2"><FlagBadge country={playerDriver.country} /></div>}
                                    <div className="mt-4 grid grid-cols-3 gap-2">
                                        <MiniMetric label="Pts" value={playerDriver.points ?? 0} />
                                        <MiniMetric label="Wins" value={playerDriver.wins ?? 0} tone="text-f1-yellow" />
                                        <MiniMetric label="Podiums" value={playerDriver.podiums ?? 0} />
                                    </div>
                                </div>

                                <div className="flex-1 grid grid-cols-1 gap-2">
                                    <StatBar label="Speed"       value={playerDriver.speed} />
                                    <StatBar label="Racing"      value={playerDriver.racing} />
                                    <StatBar label="Reaction"    value={playerDriver.reaction} />
                                    <StatBar label="Experience"  value={playerDriver.experience} />
                                    <StatBar label="Consistency" value={playerDriver.consistency} />
                                    <StatBar label="Wet"         value={playerDriver.wet_circuit_affinity} />
                                </div>
                            </div>
                        </Card>
                    )}

                    {playerDriver && budget != null && (
                        <Card className="p-5">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <div>
                                    <h2 className="font-f1-display text-sm font-bold tracking-widest text-f1-red uppercase">Entrainement pilote</h2>
                                    <p className="text-xs text-f1-muted mt-1">Investis le budget gagne en course dans les stats clefs.</p>
                                </div>
                                <div className="font-f1-display font-bold text-f1-yellow">{fmtMoney(budget)}</div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 f1-stagger">
                                {TRAINING_UPGRADES.map(({ stat, label, desc, cost }) => {
                                    const canAfford = budget >= cost;
                                    return (
                                        <button
                                            key={stat}
                                            type="button"
                                            onClick={() => handleTrain(stat)}
                                            disabled={!canAfford || busy === `train:${stat}`}
                                            className={[
                                                "rounded-xl border p-3 text-sm transition-all min-h-28",
                                                canAfford
                                                    ? "border-f1-border bg-f1-dark/45 hover:border-f1-red/50 hover:bg-f1-red/5"
                                                    : "border-f1-border/40 bg-f1-dark/20 opacity-55 cursor-not-allowed",
                                            ].join(" ")}
                                        >
                                            <div className="font-f1-display font-bold text-f1-white">{label}</div>
                                            <div className="text-xs text-f1-muted mt-1">{desc}</div>
                                            <div className="text-[10px] font-bold text-f1-yellow mt-3">{fmtMoney(cost)}</div>
                                            <div className="font-f1-display text-xs text-f1-silver mt-1">Val: {playerDriver[stat] ?? "-"}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    <Card className="p-5">
                        <h2 className="font-f1-display text-sm font-bold tracking-widest text-f1-red uppercase mb-4">Objectifs manager</h2>
                        <div className="grid md:grid-cols-2 gap-3 f1-stagger">
                            {objectives.map((objective) => <ObjectiveRow key={objective.label} {...objective} />)}
                        </div>
                    </Card>
                </div>

                <aside className="flex flex-col gap-6">
                    <Card stripe className="p-5">
                        <div className="flex items-center gap-4">
                            {userAvatar ? (
                                <img src={userAvatar} alt="avatar" className="h-16 w-16 rounded-full object-cover border-2 border-f1-border shrink-0" />
                            ) : (
                                <div className="h-16 w-16 rounded-full border-2 border-f1-border bg-f1-surface-2 flex items-center justify-center text-xl font-black text-f1-silver shrink-0">
                                    {initials || "?"}
                                </div>
                            )}
                            <div className="min-w-0">
                                <div className="font-f1-display text-lg font-bold truncate">{userName}</div>
                                <div className="text-xs text-f1-muted mt-0.5 uppercase tracking-wider">Manager</div>
                                {team && (
                                    <div className={`text-sm mt-2 font-semibold ${teamColor?.text ?? "text-f1-silver"}`}>
                                        {team.name}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {team && (
                        <Card className={`p-5 border-2 ${teamColor?.border ?? "border-f1-border"}`}>
                            <div className="f1-label mb-3">Ecurie</div>
                            <div className={`font-f1-display font-bold text-base ${teamColor?.text ?? "text-f1-white"}`}>{team.name}</div>
                            {team.country && (
                                <div className="mt-2"><FlagBadge country={team.country} /></div>
                            )}
                        </Card>
                    )}

                    <Card className="p-5">
                        <h2 className="font-f1-display text-sm font-bold tracking-widest text-f1-red uppercase mb-4">Historique recent</h2>
                        {history.length === 0 ? (
                            <div className="text-sm text-f1-muted">Aucune session simulee pour le moment.</div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {history.slice(0, 5).map((entry) => {
                                    const top = entry.results?.slice(0, 3) || [];
                                    const player = entry.results?.find((r) => clean(r.surname) === clean(playerDriver?.surname) && Number(r.number) === Number(playerDriver?.number));
                                    return (
                                        <div key={`${entry.index}-${entry.session_type}`} className="rounded-xl border border-f1-border bg-f1-dark/45 p-3">
                                            <div className="flex justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-f1-white truncate">{entry.gp_name}</div>
                                                    <div className="text-xs text-f1-muted">{SESSION_LABEL[entry.session_type] ?? entry.session_type}</div>
                                                </div>
                                                {player?.position && <div className="font-f1-display font-bold text-f1-red">P{player.position}</div>}
                                            </div>
                                            <div className="mt-2 text-xs text-f1-silver truncate">
                                                Top 3: {top.map((r) => `${r.position || "-"} ${r.surname}`).join(" / ")}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    <Card className="p-5">
                        <h2 className="font-f1-display text-sm font-bold tracking-widest text-f1-red uppercase mb-4">Sauvegarde locale</h2>
                        <div className="grid grid-cols-1 gap-2">
                            <Button variant="secondary" onClick={handleExport} fullWidth>
                                <Download className="h-4 w-4" /> Exporter la sauvegarde
                            </Button>
                            <Button variant="secondary" onClick={() => importInputRef.current?.click()} fullWidth>
                                <Upload className="h-4 w-4" /> Importer une sauvegarde
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => setSeasonResetConfirmOpen(true)}
                                disabled={busy === "season-reset"}
                                fullWidth
                            >
                                <RotateCcw className="h-4 w-4" /> Reset saison complet
                            </Button>
                            <Button variant="danger" onClick={handleClearLocalSave} fullWidth>
                                <Trash2 className="h-4 w-4" /> Effacer localement
                            </Button>
                        </div>
                        <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImportFile} />
                        <p className="text-xs text-f1-muted mt-3">
                            Le mode client-only stocke compte, saison, budget et R&D dans ce navigateur.
                        </p>
                    </Card>

                    <Card className="p-5">
                        <h2 className="font-f1-display text-sm font-bold tracking-widest text-f1-red uppercase mb-4">Changer d'avatar</h2>
                        <AvatarPicker />
                    </Card>

                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => nav(-1)} fullWidth>
                            Retour
                        </Button>
                        <Button variant="danger" onClick={() => { logout(); nav("/login"); }} fullWidth>
                            Changer de session
                        </Button>
                    </div>
                </aside>
            </div>

            <ConfirmModal
                open={seasonResetConfirmOpen}
                title="Reset complet de la saison"
                danger
                confirmLabel="Reset complet"
                loading={busy === "season-reset"}
                onClose={() => setSeasonResetConfirmOpen(false)}
                onConfirm={confirmFullSeasonReset}
            >
                Tu vas garder cette session, ton manager, ton ecurie et ton pilote choisi, mais remettre toute
                la saison sportive a zero : calendrier, resultats, classements, historique, budget, R&D et
                entrainement pilote.
            </ConfirmModal>

            <ConfirmModal
                open={clearConfirmOpen}
                title="Effacer la sauvegarde locale"
                danger
                confirmLabel="Effacer"
                onClose={() => setClearConfirmOpen(false)}
                onConfirm={confirmClearLocalSave}
            >
                Tu vas supprimer la session active de ce navigateur. Le manager, la saison, le budget,
                la R&D et l'historique local seront effaces pour cette sauvegarde.
            </ConfirmModal>
        </div>
    );
}
