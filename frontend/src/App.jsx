import { Routes, Route, Navigate } from "react-router-dom";

import LoginScreen    from "./pages/LoginScreen.jsx";
import RegisterScreen from "./pages/RegisterScreen.jsx";
import ChooseTeam     from "./pages/ChooseTeam.jsx";
import ChooseDriver   from "./pages/ChooseDriver.jsx";
import StartSeason    from "./pages/StartSeason.jsx";
import Standings      from "./pages/Standings.jsx";
import Profile        from "./pages/Profile.jsx";

import GameLayout from "./components/GameLayout.jsx";
import { useGame } from "./context/GameContext";

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

function DemoBanner() {
    if (!DEMO_MODE) return null;
    return (
        <div className="w-full bg-f1-yellow/10 border-b border-f1-yellow/30 text-f1-yellow text-center text-xs font-semibold py-1.5 tracking-wide">
            ⚡ Mode démo — aucun compte requis, données simulées côté client
        </div>
    );
}

function HomeRedirect() {
    const { ready, isAuthenticated } = useGame();
    if (!ready) return null;
    return <Navigate to={isAuthenticated ? "/choose-team" : "/login"} replace />;
}

export default function App() {
    return (
        <>
            <DemoBanner />
            <Routes>
                <Route path="/"         element={<HomeRedirect />} />
                <Route path="/login"    element={<LoginScreen />} />
                <Route path="/register" element={<RegisterScreen />} />

                {/* Setup (pas de GameNav) */}
                <Route path="/choose-team"   element={<ChooseTeam />} />
                <Route path="/choose-driver" element={<ChooseDriver />} />

                {/* Jeu (Header + GameNav via GameLayout) */}
                <Route path="/start-season" element={<GameLayout><StartSeason /></GameLayout>} />
                <Route path="/standings"    element={<GameLayout><Standings /></GameLayout>} />
                <Route path="/profile"      element={<GameLayout><Profile /></GameLayout>} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}
