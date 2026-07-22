import { Flag, Gauge, Trophy } from "lucide-react";
import FlagBadge from "../ui/FlagBadge";

function fmtPoints(value) {
    return Number(value ?? 0);
}

export default function ChampionStage({ champion, season, compact = false, player = null }) {
    if (!champion) return null;

    const isPlayerChampion = player && String(player?.surname || "").toLowerCase() === String(champion?.surname || "").toLowerCase();
    const wins = Number(champion.wins ?? 0);
    const points = fmtPoints(champion.points);

    return (
        <section className={`f1-champion-stage ${compact ? "f1-champion-stage--compact" : ""}`}>
            <div className="f1-speed-lines" aria-hidden="true" />
            <div className="f1-confetti" aria-hidden="true">
                {Array.from({ length: 14 }).map((_, i) => <span key={i} />)}
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-f1-yellow/30 bg-f1-yellow/10 px-3 py-1 text-xs font-bold text-f1-yellow">
                        <Trophy className="h-3.5 w-3.5" />
                        {season ? `Saison ${season}` : "WDC"}
                    </div>
                    <h1 className={`font-f1-display font-black text-f1-white mt-4 leading-tight ${compact ? "text-3xl" : "text-4xl md:text-6xl"}`}>
                        Champion du monde
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <FlagBadge country={champion.country} />
                        <div className={`font-f1-display font-black text-f1-yellow ${compact ? "text-2xl" : "text-3xl md:text-5xl"}`}>
                            {champion.name} <span className="uppercase">{champion.surname}</span>
                        </div>
                    </div>
                    <p className="text-sm text-f1-silver mt-3 max-w-2xl">
                        {isPlayerChampion
                            ? "Ton pilote termine la saison au sommet. Passage par le podium, puis decisions pour la saison suivante."
                            : `${champion.team} repart avec la couronne pilotes. A toi de preparer la riposte pour la prochaine saison.`}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2 min-w-[260px]">
                    <div className="f1-champion-stat">
                        <Flag className="h-4 w-4 text-f1-red" />
                        <div className="font-f1-display text-2xl font-black text-f1-white">{points}</div>
                        <div className="text-[10px] uppercase tracking-wider text-f1-muted">points</div>
                    </div>
                    <div className="f1-champion-stat">
                        <Trophy className="h-4 w-4 text-f1-yellow" />
                        <div className="font-f1-display text-2xl font-black text-f1-white">{wins}</div>
                        <div className="text-[10px] uppercase tracking-wider text-f1-muted">victoires</div>
                    </div>
                    <div className="f1-champion-stat">
                        <Gauge className="h-4 w-4 text-f1-teal" />
                        <div className="font-f1-display text-2xl font-black text-f1-white">P1</div>
                        <div className="text-[10px] uppercase tracking-wider text-f1-muted">classement</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
