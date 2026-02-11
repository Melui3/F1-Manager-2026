import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginScreen from "./pages/LoginScreen.jsx";
import RegisterScreen from "./pages/RegisterScreen.jsx";
import ChooseTeam from "./pages/ChooseTeam.jsx";
import ChooseDriver from "./pages/ChooseDriver.jsx";
import StartSeason from "./pages/StartSeason.jsx";
import Profile from "./pages/Profile.jsx";

import { useGame } from "./context/GameContext";

function HomeRedirect() {
    const { ready, isAuthenticated } = useGame();

    // évite un flash avant chargement du localStorage
    if (!ready) return null;

    return <Navigate to={isAuthenticated ? "/choose-team" : "/login"} replace />;
}

export default function App() {
    return (
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
    );
}