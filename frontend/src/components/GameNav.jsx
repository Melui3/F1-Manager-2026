import { NavLink } from "react-router-dom";

const TABS = [
    { to: "/start-season", label: "Calendrier" },
    { to: "/standings",    label: "Classements" },
    { to: "/profile",      label: "Mon Équipe"  },
];

export default function GameNav() {
    return (
        <nav className="bg-f1-surface border-b border-f1-border px-4">
            <div className="flex items-center gap-1 max-w-screen-2xl mx-auto">
                {TABS.map(({ to, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            [
                                "relative px-5 py-3 text-sm font-semibold transition-colors duration-150 font-f1",
                                isActive
                                    ? "text-f1-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-f1-red"
                                    : "text-f1-muted hover:text-f1-silver",
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
