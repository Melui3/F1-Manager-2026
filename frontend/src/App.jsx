import { Routes, Route, Navigate } from "react-router-dom";

import LoginScreen    from "./pages/LoginScreen.jsx";
import RegisterScreen from "./pages/RegisterScreen.jsx";
import ChooseTeam     from "./pages/ChooseTeam.jsx";
import ChooseDriver   from "./pages/ChooseDriver.jsx";
import StartSeason    from "./pages/StartSeason.jsx";
import Standings      from "./pages/Standings.jsx";
import Profile        from "./pages/Profile.jsx";
import EndOfSeason    from "./pages/EndOfSeason.jsx";

import GameLayout   from "./components/GameLayout.jsx";
import SetupLayout  from "./components/SetupLayout.jsx";
import { useGame }  from "./context/GameContext";
import { ToastProvider } from "./context/ToastContext.jsx";

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
    const { ready, isAuthenticated, team, driver } = useGame();
    if (!ready) return null;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (team && driver)   return <Navigate to="/start-season" replace />;
    return <Navigate to="/choose-team" replace />;
}

export default function App() {
    return (
        <ToastProvider>
            <DemoBanner />
            <Routes>
                <Route path="/"         element={<HomeRedirect />} />
                <Route path="/login"    element={<LoginScreen />} />
                <Route path="/register" element={<RegisterScreen />} />

                {/* Setup (Header via SetupLayout, pas de GameNav) */}
                <Route path="/choose-team"   element={<SetupLayout><ChooseTeam /></SetupLayout>} />
                <Route path="/choose-driver" element={<SetupLayout><ChooseDriver /></SetupLayout>} />

                {/* Jeu (Header + GameNav via GameLayout) */}
                <Route path="/start-season" element={<GameLayout><StartSeason /></GameLayout>} />
                <Route path="/standings"    element={<GameLayout><Standings /></GameLayout>} />
                <Route path="/profile"      element={<GameLayout><Profile /></GameLayout>} />
                <Route path="/end-of-season" element={<GameLayout><EndOfSeason /></GameLayout>} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </ToastProvider>
    );
}
