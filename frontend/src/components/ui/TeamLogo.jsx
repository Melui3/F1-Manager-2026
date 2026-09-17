import { useEffect, useState } from "react";
import { getTeamLivery } from "../../data/teamLiveries";

export default function TeamLogo({ team, className = "" }) {
    const livery = getTeamLivery(team);
    const [fallback, setFallback] = useState(false);
    useEffect(() => setFallback(false), [livery.key]);
    return <img className={className} src={`${import.meta.env.BASE_URL}teams/${livery.key}${fallback ? ".avif" : "-color.webp"}`} alt={`Logo ${livery.name}`} onError={() => setFallback(true)} />;
}
