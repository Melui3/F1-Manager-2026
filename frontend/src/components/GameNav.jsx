import { NavLink } from "react-router-dom";

const TABS = [
    { to: "/start-season", label: "Calendrier" },
    { to: "/standings",    label: "Classements" },
    { to: "/profile",      label: "Mon Équipe"  },
];

export default function GameNav() {
    return (
        <nav className="bg-f1-surface/90 border-b border-f1-border px-4 backdrop-blur">
            <div className="flex items-center gap-2 max-w-screen-2xl mx-auto py-2">
                {TABS.map(({ to, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            [
                                "f1-motion-button relative px-5 py-2.5 text-sm font-semibold transition-all duration-150 font-f1 rounded-xl",
                                isActive
                                    ? "text-f1-white bg-f1-red shadow-lg shadow-f1-red/20"
                                    : "text-f1-muted hover:text-f1-silver hover:bg-f1-surface-2",
                            ].join(" ")
                        }
                    >
                        {label}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
