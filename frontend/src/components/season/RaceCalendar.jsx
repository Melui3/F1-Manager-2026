import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, Check, ChevronDown, Flag, MapPin, Play, RotateCcw, Trophy } from "lucide-react";
import FlagBadge from "../ui/FlagBadge";
import ChampionStage from "./ChampionStage";
import { getSeasonRounds, CIRCUIT_ASSETS } from "../../services/seasonCalendar";
import { GP_CIRCUIT_SUMMARY, SESSION_LABEL } from "../../data/labels";
import { getTeamLivery } from "../../data/teamLiveries";
import "./raceCalendar.css";

const dateLabel = (date) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
const money = (value) => new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 2 }).format(value);

function CircuitPhoto({ round, priority = false }) {
    const [failed, setFailed] = useState(false);
    return failed ? <div className="calendar-photo-fallback"><MapPin size={40} /><span>{round.circuit}</span></div> : <img className="calendar-circuit-photo" src={`${import.meta.env.BASE_URL}circuits/${CIRCUIT_ASSETS[round.name]}.webp`} alt={`Visuel du ${round.name}`} loading={priority ? "eager" : "lazy"} onError={() => setFailed(true)} />;
}

function SessionSchedule({ round, nextRace, onResults }) {
    return <ol className="weekend-sessions" aria-label={`Programme ${round.name}`}>
        {round.sessions.map((session) => <li key={session.index} className={session.is_simulated ? "is-done" : session.index === nextRace?.index ? "is-next" : ""}>
            <span>{session.is_simulated ? <Check size={14} /> : <Flag size={14} />}{SESSION_LABEL[session.session_type]}</span>
            {session.is_simulated ? <button type="button" onClick={() => onResults(session)} aria-label={`Résultats ${SESSION_LABEL[session.session_type]}, ${round.name}`}>Résultats <ArrowRight size={13} /></button> : <small>{round.done ? "NON DISPUTÉ" : session.index === nextRace?.index ? "À DISPUTER" : "PROGRAMMÉ"}</small>}
        </li>)}
    </ol>;
}

function RoundCard({ round, driver, onResults }) {
    const result = round.sessions.find((item) => item.session_type === "GP")?.results;
    const winner = result?.find((item) => item.position === 1);
    const player = result?.find((item) => item.id === driver.id);
    return <article className={`calendar-round ${round.done ? "is-complete" : ""}`} data-round={round.number}>
        {!round.done && <div className="round-photo"><CircuitPhoto round={round} /><span>ROUND {String(round.number).padStart(2, "0")}</span>{round.sprint && <b>SPRINT</b>}</div>}
        <div className="round-body">
            <div className="round-date">{round.done && <span>R{String(round.number).padStart(2, "0")}</span>}<time dateTime={round.date}>{dateLabel(round.date)}</time>{round.done && <Check size={15} />}</div>
            <h3><FlagBadge gpName={round.name} compact />{round.name}</h3>
            <p className="round-circuit">{round.circuit}</p>
            {round.done && <p className="round-podium"><Trophy size={14} />{winner?.surname ?? "Résultat enregistré"}<strong>{player ? `P${player.position} · +${player.points_gained ?? 0} pts` : ""}</strong></p>}
            <details><summary>{round.done ? "Résultats du week-end" : "Programme du week-end"}<ChevronDown size={15} /></summary>
                {!round.done && <p className="round-summary">{GP_CIRCUIT_SUMMARY[round.name]}</p>}
                <SessionSchedule round={round} onResults={onResults} />
            </details>
        </div>
    </article>;
}

export default function RaceCalendar({ calendar, liveRace, driver, team, season, budget, playerRank, playerPoints, loading, error, onResults, onReset, onStandings, champion }) {
    const navigate = useNavigate();
    const [allHistory, setAllHistory] = useState(false);
    const { rounds, completed, current, upcoming, nextRace } = useMemo(() => getSeasonRounds(calendar, liveRace), [calendar, liveRace]);
    const livery = getTeamLivery(team);
    const active = liveRace?.status === "racing";
    const history = [...completed].reverse().slice(0, allHistory ? undefined : 3);
    if (loading) return <div className="season-loading"><span className="f1-spinner" />Chargement du calendrier…</div>;
    return <div className="season-calendar" style={{ "--season-team": livery.color }}>
        <header className="season-heading"><div><span className="season-kicker">F1 MANAGER / SAISON {season}</span><h1>Calendrier des Grands Prix</h1></div><div className="season-header-actions"><button type="button" onClick={onStandings}><Trophy size={17} />Classement</button><button type="button" className="calendar-icon" aria-label="Réinitialiser la saison" title="Réinitialiser la saison" onClick={onReset}><RotateCcw size={18} /></button></div></header>
        {error && <p className="season-error" role="alert">{error}</p>}
        <div className="season-manager"><span className="manager-driver"><b>#{driver.number}</b>{driver.name} {driver.surname}<FlagBadge country={driver.country} compact /></span><span>{livery.name}</span><span>Championnat <strong>{playerRank > 0 ? `P${playerRank}` : "--"} · {playerPoints} pts</strong></span><span>Budget <strong>{money(budget)}</strong></span></div>
        <div className="season-progress" aria-label={`${completed.length} manches terminées sur ${rounds.length}`}>{rounds.map((round) => <span key={round.name} className={round.done ? "is-done" : round === current ? "is-current" : ""} title={`${round.number}. ${round.name}`} />)}</div>

        {completed.length > 0 && <section className="calendar-history" aria-label="Courses terminées"><div className="calendar-section-heading"><h2><Check size={17} />Dans le rétro <span>{completed.length}</span></h2>{completed.length > 3 && <button type="button" aria-expanded={allHistory} onClick={() => setAllHistory((value) => !value)}>{allHistory ? "Les trois dernières" : "Toutes les manches"}<ChevronDown size={15} /></button>}</div><div className="calendar-round-grid">{history.map((round) => <RoundCard key={round.name} round={round} driver={driver} onResults={onResults} />)}</div></section>}

        {current && <section className="calendar-current" aria-label="Course actuelle" data-round={current.number}>
            <div className="current-race-photo"><CircuitPhoto key={current.name} round={current} priority /><div className="current-race-shade" />
                <div className="current-race-top"><span className="race-round-number">ROUND <b>{String(current.number).padStart(2, "0")}</b> / {rounds.length}</span><span className="current-race-status"><span />{active ? `EN COURS · TOUR ${liveRace.lap}/${liveRace.totalLaps}` : "PROCHAINE COURSE"}</span></div>
                <div className="current-race-title"><FlagBadge gpName={current.name} /><h2>{current.name}</h2><p><MapPin size={16} />{current.circuit}<span /> <CalendarDays size={16} />{dateLabel(current.date)}</p></div>
            </div>
            <div className="current-race-action"><div><span className="season-kicker">{current.sprint ? "WEEK-END SPRINT" : "WEEK-END DE GRAND PRIX"}</span><h3>{active ? "Le stand attend tes consignes." : nextRace?.session_type === "S" ? "Le Sprint ouvre les hostilités." : "La prochaine bataille commence ici."}</h3></div><button type="button" className="calendar-race-button" onClick={() => navigate(`/race/${nextRace.index}`)}><Play size={19} fill="currentColor" />{active ? "Reprendre" : "Simuler"}<ArrowRight size={19} /></button></div>
            <div className="current-weekend"><div><h3>Le circuit</h3><p>{GP_CIRCUIT_SUMMARY[current.name]}</p><span className="circuit-type">{current.type === "street" ? "Circuit urbain" : "Circuit rapide"}</span></div><div><h3>Le programme</h3><SessionSchedule round={current} nextRace={nextRace} onResults={onResults} /></div></div>
        </section>}

        {!current && !error && <><ChampionStage champion={champion} season={season} player={driver} compact /><section className="calendar-season-complete"><span className="season-kicker">DRAPEAU À DAMIER</span><h2>Saison {season} terminée</h2><button type="button" className="calendar-race-button" onClick={() => navigate("/end-of-season")}>Bilan de saison<ArrowRight size={18} /></button></section></>}
        {upcoming.length > 0 && <section className="calendar-upcoming" aria-label="Courses à venir"><div className="calendar-section-heading"><h2><CalendarDays size={18} />À l'horizon <span>{upcoming.length}</span></h2><span>{completed.length}/{rounds.length} manches terminées</span></div><div className="calendar-round-grid">{upcoming.map((round) => <RoundCard key={round.name} round={round} driver={driver} onResults={onResults} />)}</div></section>}
    </div>;
}
