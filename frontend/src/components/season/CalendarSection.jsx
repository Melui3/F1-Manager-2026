import Button from "../ui/Button";
import Alert from "../ui/Alert";
import { SESSION_LABEL, CIRCUIT_ICON, CIRCUIT_TYPE_META, GP_CIRCUIT_SUMMARY } from "../../data/labels";
import FlagBadge from "../ui/FlagBadge";

// ─── GP status helpers ────────────────────────────────────────────────────────

function gpStatus(sessions = []) {
    if (!sessions.length) return "upcoming";
    const done = sessions.filter((s) => !!s.is_simulated).length;
    if (done === 0) return "upcoming";
    if (done < sessions.length) return "in_progress";
    return "done";
}

function statusUI(status) {
    switch (status) {
        case "done":
            return {
                card: "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/8",
                pill: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                label: "Terminé",
            };
        case "in_progress":
            return {
                card: "border-f1-yellow/30 bg-f1-yellow/5 hover:bg-f1-yellow/8",
                pill: "bg-f1-yellow/15 text-f1-yellow border-f1-yellow/30",
                label: "En cours",
            };
        default:
            return {
                card: "border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/8",
                pill: "bg-sky-500/15 text-sky-300 border-sky-500/30",
                label: "À venir",
            };
    }
}

// ─── Season progress bar ──────────────────────────────────────────────────────

function SeasonProgress({ total, done }) {
    if (!total) return null;
    const pct = Math.round((done / total) * 100);

    return (
        <div className="mb-5">
            <div className="flex justify-between text-xs text-f1-muted mb-1.5">
                <span className="font-semibold text-f1-silver">Progression saison</span>
                <span className="font-f1-display font-bold text-f1-white">{done}/{total} sessions</span>
            </div>
            <div className="h-2 rounded-full bg-f1-dark/60 border border-f1-border overflow-hidden">
                <div
                    className="h-full rounded-full bg-f1-red transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className="text-right text-[10px] text-f1-muted mt-1">{pct}%</div>
        </div>
    );
}

// ─── Session row ──────────────────────────────────────────────────────────────

function SessionRow({ s, isBusy, onSimulate, onForce }) {
    const sessionLabel = SESSION_LABEL[s.session_type] ?? s.session_type;
    const circuitMeta = CIRCUIT_TYPE_META[s.circuit_type] || { label: s.circuit_type, description: "" };
    const circuitIcon = CIRCUIT_ICON[s.circuit_type] ?? "";

    return (
        <div className="f1-soft-panel rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm">
                <div className="font-semibold text-f1-white">
                    {sessionLabel}
                    <span className="ml-2 text-f1-muted font-normal text-xs">
                        {circuitIcon} {circuitMeta.label}
                    </span>
                </div>
                <div className="text-f1-silver text-xs mt-0.5">
                    {s.date ?? "—"}{" "}
                    {s.is_simulated ? (
                        <span className="ml-2 text-emerald-400">✔ simulé</span>
                    ) : (
                        <span className="ml-2 text-f1-muted">non simulé</span>
                    )}
                </div>
            </div>

            <div className="flex gap-2">
                <Button size="sm" onClick={() => onSimulate(s)} disabled={isBusy}>
                    Simuler
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onForce(s)} disabled={isBusy}>
                    Force
                </Button>
            </div>
        </div>
    );
}

// ─── GP card ──────────────────────────────────────────────────────────────────

function GpCard({ gpName, sessions, expanded, onToggle, isBusy, onSimulate, onForce, onSimulateGp }) {
    const status = gpStatus(sessions);
    const ui = statusUI(status);
    const gpDate = sessions?.[0]?.date ?? "—";
    const circuit = sessions?.[0]?.circuit_name ?? "—";
    const circuitType = sessions?.[0]?.circuit_type;
    const circuitMeta = CIRCUIT_TYPE_META[circuitType] || { label: circuitType || "Circuit", description: "" };
    const circuitIcon = CIRCUIT_ICON[circuitType] ?? "";
    const circuitSummary = GP_CIRCUIT_SUMMARY[gpName] || "Résumé circuit indisponible pour ce Grand Prix.";
    const remaining = sessions.filter((s) => !s.is_simulated).length;

    return (
        <div className={`border-2 rounded-2xl p-4 md:p-5 transition-all ${ui.card}`}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1 flex-1 cursor-pointer select-none" onClick={onToggle}>
                    <div className="flex items-center gap-2 flex-wrap">
                        <FlagBadge gpName={gpName} compact />
                        <span className="font-f1-display font-bold text-base text-f1-white">{gpName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${ui.pill}`}>{ui.label}</span>
                        {circuitType && (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-f1-border bg-f1-dark/50 text-f1-silver" title={circuitMeta.description}>
                                {circuitIcon} {circuitMeta.label}
                            </span>
                        )}
                    </div>
                    <span className="text-sm text-f1-silver">{circuit} • {gpDate}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {remaining > 0 && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); onSimulateGp(); }}
                            disabled={isBusy}
                        >
                            Simuler GP
                        </Button>
                    )}
                    <span className="text-f1-muted text-sm">{expanded ? "▲" : "▼"}</span>
                </div>
            </div>

            {expanded && (
                <div className="mt-4 flex flex-col gap-2 f1-fade-in">
                    <div className="rounded-xl border border-f1-border bg-f1-dark/55 p-4">
                        <div className="font-f1-display text-xs font-bold uppercase tracking-widest text-f1-red mb-2">
                            Resume du circuit
                        </div>
                        <p className="text-sm text-f1-silver leading-relaxed">{circuitSummary}</p>
                        <div className="mt-3 text-xs text-f1-muted">
                            <div className="rounded-lg border border-f1-border bg-f1-surface/50 p-2">
                                <span className="text-f1-silver font-semibold">Icone :</span>{" "}
                                {circuitIcon} {circuitMeta.label} - {circuitMeta.description}
                            </div>
                        </div>
                    </div>
                    {sessions.map((s) => (
                        <SessionRow
                            key={s.index}
                            s={s}
                            isBusy={isBusy}
                            onSimulate={(session) => onSimulate(session.index, false, session)}
                            onForce={(session) => onForce(session.index, true, session)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarSection({
    loading,
    error,
    gpNames,
    calendarByGp,
    expandedGp,
    toggleGp,
    nextSession,
    isBusy,
    simLoading,
    simAllLoading,
    simAllProgress,
    onSimulateNext,
    onForceNext,
    onSimulateAll,
    onForceAll,
    onSimulateOne,
    onSimulateGp,
    onStop,
    totalSessions,
    simulatedSessions,
    season,
    objectives = [],
}) {
    return (
        <section className="flex-1 flex flex-col gap-5">
            {/* Header card */}
            <div className="bg-f1-surface border border-f1-border rounded-2xl p-5 md:p-6 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-f1-red" />

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="flex-1">
                        <h1 className="font-f1-display text-2xl md:text-3xl font-bold">
                            CALENDRIER <span className="text-f1-red">{season ?? 2026}</span>
                        </h1>
                        <p className="text-sm text-f1-silver mt-2 leading-relaxed">
                            C'est le centre de simulation de ta session locale. Chaque bouton modifie uniquement
                            la sauvegarde du manager actif : resultats, budget, progression pilote et historique.
                        </p>

                        <div className="mt-4 rounded-xl border border-f1-border bg-f1-dark/60 p-4">
                            <h2 className="font-f1-display text-xs font-bold text-f1-white mb-2 tracking-wider uppercase">
                                Comment ça marche ?
                            </h2>
                            <ul className="text-sm text-f1-silver space-y-1 leading-relaxed">
                                <li>• Clique un <b className="text-f1-white">GP</b> pour afficher ses sessions.</li>
                                <li>• <b className="text-f1-white">Simuler</b> lance la session et ouvre les résultats.</li>
                                <li>• <b className="text-f1-white">Simuler next</b> lance la prochaine session non simulée.</li>
                                <li>• <b className="text-f1-white">Simuler tout</b> enchaîne toutes les sessions restantes.</li>
                                <li>• <b className="text-f1-white">Force</b> resimule même si déjà simulé.</li>
                            </ul>
                        </div>

                        {objectives.length > 0 && (
                            <div className="mt-4 grid md:grid-cols-3 gap-2">
                                {objectives.map((objective) => (
                                    <div
                                        key={objective.label}
                                        className={[
                                            "rounded-xl border px-3 py-2.5 text-xs transition-colors",
                                            objective.done
                                                ? "border-emerald-500/30 bg-emerald-500/10"
                                                : "border-f1-border bg-f1-dark/50",
                                        ].join(" ")}
                                    >
                                        <div className={objective.done ? "font-bold text-emerald-400" : "font-bold text-f1-white"}>
                                            {objective.label}
                                        </div>
                                        <div className="text-f1-silver mt-1 leading-snug">{objective.value}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sim buttons */}
                    <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
                        <Button
                            onClick={onSimulateNext}
                            disabled={isBusy || !nextSession}
                            loading={simLoading}
                        >
                            {simLoading ? "Simulation…" : "Simuler next"}
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={onForceNext}
                            disabled={isBusy || !nextSession}
                        >
                            Force next
                        </Button>

                        <Button
                            variant="ghost"
                            className="bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30"
                            onClick={onSimulateAll}
                            disabled={isBusy || !nextSession}
                            loading={simAllLoading}
                        >
                            {simAllLoading
                                ? `Saison… (${simAllProgress.done}/${simAllProgress.total})`
                                : "Simuler tout"}
                        </Button>

                        <Button
                            variant="ghost"
                            className="bg-emerald-950/60 hover:bg-emerald-950/80 text-emerald-400 border border-emerald-700/40"
                            onClick={onForceAll}
                            disabled={isBusy || !nextSession}
                        >
                            Force tout
                        </Button>

                        {simAllLoading && (
                            <Button variant="secondary" onClick={onStop}>
                                Stop
                            </Button>
                        )}
                    </div>
                </div>

                {nextSession && (
                    <div className="mt-4 text-xs text-f1-muted">
                        Prochaine session :{" "}
                        <span className="inline-flex items-center gap-2 text-f1-silver font-semibold">
                            <FlagBadge gpName={nextSession.gp_name} compact /> {nextSession.gp_name}
                        </span>
                        {" "}• <span className="text-f1-white">{SESSION_LABEL[nextSession.session_type] ?? nextSession.session_type}</span>
                    </div>
                )}
            </div>

            {error && <Alert type="error">{error}</Alert>}

            {/* Season progress */}
            {!loading && totalSessions > 0 && (
                <SeasonProgress total={totalSessions} done={simulatedSessions} />
            )}

            {/* Calendar list */}
            <div className="flex flex-col gap-3 f1-stagger">
                {loading ? (
                    <div className="flex items-center gap-3 text-f1-silver px-1">
                        <span className="f1-spinner" /> Chargement…
                    </div>
                ) : gpNames.length === 0 ? (
                    <div className="bg-f1-surface border border-f1-border rounded-2xl p-5 text-f1-silver text-sm">
                        Aucun Grand Prix disponible dans cette session.
                        <div className="text-xs text-f1-muted mt-2">
                            Reviens a l'accueil pour reprendre une autre session ou cree une nouvelle partie.
                        </div>
                    </div>
                ) : (
                    gpNames.map((gpName) => {
                        const sessions = calendarByGp[gpName] || [];
                        return (
                            <GpCard
                                key={gpName}
                                gpName={gpName}
                                sessions={sessions}
                                expanded={expandedGp === gpName}
                                onToggle={() => toggleGp(gpName)}
                                isBusy={isBusy}
                                onSimulate={onSimulateOne}
                                onForce={onSimulateOne}
                                onSimulateGp={() => onSimulateGp(gpName)}
                            />
                        );
                    })
                )}
            </div>
        </section>
    );
}
