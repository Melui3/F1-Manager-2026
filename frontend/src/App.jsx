import { Routes, Route, Navigate } from "react-router-dom";
import LoginScreen from "./pages/login.jsx";
import ChooseTeam from "./pages/chooseTeam.jsx";
import ChooseDriver from "./pages/chooseDriver.jsx";
import StartSeason from "./pages/startseason.jsx";
import Profile from "./pages/Profile.jsx";
import RegisterScreen from "./pages/RegisterScreen.jsx";
// ...imports pages

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/choose-team" element={<ChooseTeam />} />
            <Route path="/choose-driver" element={<ChooseDriver />} />
            <Route path="/startseason" element={<StartSeason />} />
            <Route path="/profile" element={<Profile />} />
        </Routes>
    );
}