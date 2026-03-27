import { Routes, Route, Navigate } from "react-router-dom";

import LoginScreen from "./pages/LoginScreen.jsx";
import RegisterScreen from "./pages/RegisterScreen.jsx";
import ChooseTeam from "./pages/ChooseTeam.jsx";
import ChooseDriver from "./pages/ChooseDriver.jsx";
import StartSeason from "./pages/StartSeason.jsx";
import Profile from "./pages/Profile.jsx";

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

    // évite un flash avant chargement du localStorage
    if (!ready) return null;

    return <Navigate to={isAuthenticated ? "/choose-team" : "/login"} replace />;
}

export default function App() {
    return (
        <>
        <DemoBanner />
        <Routes>
            {/* ✅ Fix: route racine */}
            <Route path="/" element={<HomeRedirect />} />

            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />

            {/* tes routes existantes */}
            <Route path="/choose-team" element={<ChooseTeam />} />
            <Route path="/choose-driver" element={<ChooseDriver />} />
            <Route path="/start-season" element={<StartSeason />} />
            <Route path="/profile" element={<Profile />} />

            {/* ✅ fallback si route inconnue */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </>
    );
}