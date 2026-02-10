import React from "react";
import ReactDOM from "react-dom/client";
import {BrowserRouter, HashRouter} from "react-router-dom";
import App from "./App.jsx";
import { GameProvider } from "./context/GameContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <HashRouter>
            <GameProvider>
                <App />
            </GameProvider>
        </HashRouter>
    </React.StrictMode>
);