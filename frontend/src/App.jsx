import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

import LoginScreen    from "./pages/LoginScreen.jsx";
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
import { RacePresentationProvider } from "./components/presentation/RacePresentation";
const LiveRace = lazy(() => import("./pages/LiveRace"));

function HomeRedirect() {
    const { ready, isAuthenticated, team, driver } = useGame();
    if (!ready) return null;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (team && driver)   return <Navigate to="/calendar" replace />;
    return <Navigate to="/choose-team" replace />;
}

export default function App() {
    return (
        <ToastProvider>
            <RacePresentationProvider>
            <Routes>
                <Route path="/"         element={<HomeRedirect />} />
                <Route path="/login"    element={<LoginScreen />} />
                <Route path="/register" element={<Navigate to="/login" replace />} />

                {/* Setup (Header via SetupLayout, pas de GameNav) */}
                <Route path="/choose-team"   element={<SetupLayout><ChooseTeam /></SetupLayout>} />
                <Route path="/choose-driver" element={<SetupLayout><ChooseDriver /></SetupLayout>} />

                {/* Jeu (Header + GameNav via GameLayout) */}
                <Route path="/start-season" element={<Navigate to="/calendar" replace />} />
                <Route path="/calendar" element={<GameLayout><StartSeason /></GameLayout>} />
                <Route path="/race/:sessionIndex" element={<GameLayout><Suspense fallback={<div className="p-8 text-f1-silver">Ouverture du pit wall…</div>}><LiveRace /></Suspense></GameLayout>} />
                <Route path="/race-live" element={<GameLayout><Suspense fallback={<div className="p-8 text-f1-silver">Ouverture du pit wall…</div>}><LiveRace /></Suspense></GameLayout>} />
                <Route path="/standings"    element={<GameLayout><Standings /></GameLayout>} />
                <Route path="/profile"      element={<GameLayout><Profile /></GameLayout>} />
                <Route path="/end-of-season" element={<GameLayout><EndOfSeason /></GameLayout>} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </RacePresentationProvider>
        </ToastProvider>
    );
}
