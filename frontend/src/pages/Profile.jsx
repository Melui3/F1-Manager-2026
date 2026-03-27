import Header from "../components/Header.jsx";
import AvatarPicker from "../components/AvatarPicker.jsx";
import { useGame } from "../context/GameContext";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function Profile() {
    const { userName, userAvatar, setUserAvatar, setAvatarKey, logout } = useGame();
    const nav = useNavigate();

    function onChanged(url, key) {
        setUserAvatar(url);
        if (key) setAvatarKey(key);
    }

    const initials = (userName || "?")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");

    return (
        <div className="min-h-screen bg-f1-dark text-f1-white flex flex-col">
            <Header />

            <main className="flex-1 p-6 max-w-4xl mx-auto w-full f1-fade-in">
                <h1 className="font-f1-display text-3xl font-bold mb-1">PROFIL</h1>
                <p className="text-f1-silver mb-6 text-sm">Gère ton avatar et ta session.</p>

                {/* Carte identité */}
                <Card stripe className="p-5 mb-5 flex items-center gap-4">
                    {userAvatar ? (
                        <img
                            src={userAvatar}
                            alt="avatar"
                            className="h-16 w-16 rounded-full object-cover border-2 border-f1-border shrink-0"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                    ) : (
                        <div className="h-16 w-16 rounded-full border-2 border-f1-border bg-f1-surface-2 flex items-center justify-center text-xl font-black text-f1-silver shrink-0">
                            {initials || "?"}
                        </div>
                    )}

                    <div>
                        <div className="font-f1-display text-lg font-bold">{userName}</div>
                        <div className="text-sm text-f1-silver mt-0.5">Compte connecté</div>
                    </div>
                </Card>

                {/* Changer l'avatar */}
                <Card className="p-5 mb-6">
                    <h2 className="font-f1-display text-sm font-bold tracking-widest text-f1-red uppercase mb-4">
                        Changer d'avatar
                    </h2>
                    <AvatarPicker onChanged={onChanged} />
                </Card>

                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => nav(-1)}>
                        Retour
                    </Button>

                    <Button
                        variant="danger"
                        onClick={() => {
                            logout();
                            nav("/login");
                        }}
                    >
                        Se déconnecter
                    </Button>
                </div>
            </main>
        </div>
    );
}
