import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Flag,
    HardDrive,
    Play,
    Plus,
    RefreshCw,
    RotateCcw,
    ShieldCheck,
    Trash2,
    Trophy,
    Users,
} from "lucide-react";
import { useGame } from "../context/GameContext";
import {
    createSessionProfile,
    deleteSessionProfile,
    getSessionProfiles,
    resetSessionProfile,
} from "../services/sessionStore";
import Button from "../components/ui/Button";
import Input, { Select } from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import Card from "../components/ui/Card";
import ConfirmModal from "../components/modals/ConfirmModal";

const AVATARS = [
    "verstappen", "leclerc", "norris", "hamilton", "alonso", "sainz",
    "piastri", "gasly", "albon", "bearman", "antonelli", "bortoleto",
];

function formatDate(value) {
    if (!value) return "Jamais";
    try {
        return new Intl.DateTimeFormat("fr-FR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(value));
    } catch {
        return "Date inconnue";
    }
}

function ConceptItem({ icon, title, text }) {
    const ConceptIcon = icon;
    return (
        <div className="rounded-xl border border-f1-border bg-f1-dark/45 p-4">
            <div className="flex items-center gap-2 text-f1-white font-semibold">
                <ConceptIcon className="h-4 w-4 text-f1-red" />
                {title}
            </div>
            <p className="text-sm text-f1-silver mt-2 leading-relaxed">{text}</p>
        </div>
    );
}

function SessionCard({ profile, active, onResume, onReset, onDelete }) {
    const base = import.meta.env.BASE_URL || "/";
    const avatarSrc = `${base}avatars/${profile.avatarKey || "verstappen"}.jpg`;

    return (
        <div className={[
            "rounded-xl border p-4 bg-f1-dark/45 transition-colors",
            active ? "border-f1-red/50" : "border-f1-border hover:border-f1-red/30",
        ].join(" ")}>
            <div className="flex items-start gap-3">
                <img
                    src={avatarSrc}
                    alt={profile.name}
                    className="h-12 w-12 rounded-xl object-cover border border-f1-border shrink-0"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <div className="font-f1-display font-bold text-f1-white truncate">{profile.name}</div>
                        {active && (
                            <span className="text-[10px] font-bold rounded-full bg-f1-red/15 text-f1-red px-2 py-0.5">
                                ACTIVE
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-f1-muted mt-1">
                        Derniere utilisation : {formatDate(profile.updatedAt)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
                <Button size="sm" onClick={onResume}>
                    <Play className="h-3.5 w-3.5" /> Reprendre
                </Button>
                <Button size="sm" variant="secondary" onClick={onReset}>
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
                <Button size="sm" variant="danger" onClick={onDelete}>
                    <Trash2 className="h-3.5 w-3.5" /> Effacer
                </Button>
            </div>
        </div>
    );
}

export default function LoginScreen() {
    const [managerName, setManagerName] = useState("");
    const [avatarKey, setAvatarKey] = useState("verstappen");
    const [profiles, setProfiles] = useState(() => getSessionProfiles());
    const [msg, setMsg] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    const navigate = useNavigate();
    const { activeSessionId, activateSession, refreshSession } = useGame();

    const base = import.meta.env.BASE_URL || "/";
    const logoUrl = `${base}logo-f1m-2026.png`;
    const avatarPreview = useMemo(() => `${base}avatars/${avatarKey}.jpg`, [base, avatarKey]);

    const reloadProfiles = () => {
        setProfiles(getSessionProfiles());
    };

    const handleCreate = () => {
        const name = managerName.trim();
        if (!name) {
            setMsg({ type: "error", text: "Donne un nom a ton manager pour creer une session." });
            return;
        }

        const profile = createSessionProfile(name, avatarKey);
        activateSession(profile.id);
        refreshSession();
        navigate("/choose-team");
    };

    const handleResume = (profile) => {
        activateSession(profile.id);
        refreshSession();
        navigate("/");
    };

    const handleRefresh = () => {
        reloadProfiles();
        refreshSession();
        setMsg({ type: "success", text: "Liste des sessions rafraichie." });
    };

    const handleReset = (profile) => {
        setConfirmAction({ type: "reset", profile });
    };

    const handleDelete = (profile) => {
        setConfirmAction({ type: "delete", profile });
    };

    const confirmProfileAction = () => {
        const profile = confirmAction?.profile;
        if (!profile) return;

        if (confirmAction.type === "reset") {
            resetSessionProfile(profile.id);
            reloadProfiles();
            if (profile.id === activeSessionId) refreshSession();
            setMsg({ type: "info", text: `Session de ${profile.name} remise a zero.` });
        } else {
            deleteSessionProfile(profile.id);
            reloadProfiles();
            if (profile.id === activeSessionId) refreshSession();
            setMsg({ type: "info", text: `Session de ${profile.name} supprimee.` });
        }

        setConfirmAction(null);
    };

    return (
        <div className="min-h-screen bg-f1-dark text-f1-white px-4 py-8 md:py-12">
            <div className="max-w-screen-2xl mx-auto grid xl:grid-cols-[minmax(0,1.1fr)_520px] gap-8 items-start">
                <section className="flex flex-col gap-6">
                    <div className="f1-fade-in">
                        <img src={logoUrl} alt="F1 Manager 2026" className="h-14 w-auto object-contain mb-5" />
                        <h1 className="font-f1-display text-4xl md:text-5xl font-black tracking-tight">
                            F1 MANAGER <span className="text-f1-red">2026</span>
                        </h1>
                        <p className="text-f1-silver text-base md:text-lg mt-4 max-w-3xl leading-relaxed">
                            Un jeu de management F1 leger, jouable sans serveur. Chaque manager possede sa
                            propre sauvegarde locale : choix d'ecurie, pilote, calendrier, resultats, budget
                            et developpement restent separes dans ce navigateur.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 f1-stagger">
                        <ConceptItem
                            icon={Users}
                            title="Plusieurs managers"
                            text="Cree un profil par joueur, par essai ou par strategie. Les saisons ne se melangent plus."
                        />
                        <ConceptItem
                            icon={Flag}
                            title="Saison simulee"
                            text="Choisis une ecurie, signe un pilote puis enchaine essais, qualifs, sprints et Grands Prix."
                        />
                        <ConceptItem
                            icon={Trophy}
                            title="Objectif sportif"
                            text="Les classements pilotes et constructeurs evoluent apres chaque session simulee."
                        />
                        <ConceptItem
                            icon={ShieldCheck}
                            title="Management"
                            text="Investis le budget gagne en course dans l'entrainement pilote et la R&D ecurie."
                        />
                    </div>

                    <Card className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h2 className="font-f1-display text-sm font-bold tracking-widest text-f1-red uppercase">
                                    Sessions sauvegardees
                                </h2>
                                <p className="text-sm text-f1-muted mt-1">
                                    Reprends une partie existante ou rafraichis la liste si tu viens d'importer une sauvegarde.
                                </p>
                            </div>
                            <Button variant="secondary" onClick={handleRefresh}>
                                <RefreshCw className="h-4 w-4" /> Rafraichir
                            </Button>
                        </div>

                        {msg && (
                            <Alert type={msg.type} className="mt-4">
                                {msg.text}
                            </Alert>
                        )}

                        <div className="mt-5 grid lg:grid-cols-2 gap-3 f1-stagger">
                            {profiles.length === 0 ? (
                                <div className="lg:col-span-2 rounded-xl border border-f1-border bg-f1-dark/45 p-5 text-sm text-f1-silver">
                                    Aucune session locale pour le moment. Cree ton premier manager pour demarrer.
                                </div>
                            ) : (
                                profiles.map((profile) => (
                                    <SessionCard
                                        key={profile.id}
                                        profile={profile}
                                        active={profile.id === activeSessionId}
                                        onResume={() => handleResume(profile)}
                                        onReset={() => handleReset(profile)}
                                        onDelete={() => handleDelete(profile)}
                                    />
                                ))
                            )}
                        </div>
                    </Card>
                </section>

                <aside className="xl:sticky xl:top-8">
                    <Card stripe className="p-6 f1-fade-in">
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div>
                                <h2 className="font-f1-display text-base font-bold tracking-widest text-f1-silver uppercase">
                                    Nouvelle session
                                </h2>
                                <p className="text-sm text-f1-muted mt-2">
                                    Aucun compte, aucun mot de passe. Le nom sert juste a separer les sauvegardes.
                                </p>
                            </div>
                            <HardDrive className="h-5 w-5 text-f1-red shrink-0" />
                        </div>

                        <div className="flex flex-col gap-4">
                            <Input
                                label="Nom du manager"
                                type="text"
                                placeholder="Ex: Alex, Test Ferrari, Saison agressive"
                                value={managerName}
                                onChange={(e) => setManagerName(e.target.value)}
                            />

                            <div className="rounded-xl border border-f1-border bg-f1-dark/50 p-3">
                                <span className="f1-label">Avatar</span>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={avatarPreview}
                                        alt={avatarKey}
                                        className="h-14 w-14 rounded-xl object-cover border border-f1-border"
                                    />
                                    <Select value={avatarKey} onChange={(e) => setAvatarKey(e.target.value)}>
                                        {AVATARS.map((key) => (
                                            <option key={key} value={key}>
                                                {key.charAt(0).toUpperCase() + key.slice(1)}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            </div>

                            <Button size="lg" fullWidth onClick={handleCreate}>
                                <Plus className="h-4 w-4" /> Creer et commencer
                            </Button>
                        </div>
                    </Card>
                </aside>
            </div>

            <ConfirmModal
                open={!!confirmAction}
                title={confirmAction?.type === "delete" ? "Supprimer la session" : "Remettre la session a zero"}
                danger={confirmAction?.type === "delete"}
                confirmLabel={confirmAction?.type === "delete" ? "Supprimer" : "Reset"}
                onClose={() => setConfirmAction(null)}
                onConfirm={confirmProfileAction}
            >
                {confirmAction?.type === "delete" ? (
                    <>
                        Tu vas supprimer definitivement la session de{" "}
                        <span className="font-bold text-f1-white">{confirmAction.profile?.name}</span>.
                        La sauvegarde locale associee sera effacee de ce navigateur.
                    </>
                ) : (
                    <>
                        Tu vas remettre a zero la partie de{" "}
                        <span className="font-bold text-f1-white">{confirmAction?.profile?.name}</span>.
                        Le profil reste disponible, mais l'equipe, le pilote, le calendrier et la progression repartent de zero.
                    </>
                )}
            </ConfirmModal>
        </div>
    );
}
