import Header from "./Header";
import GameNav from "./GameNav";

/**
 * Layout pour les pages en jeu (Calendrier, Classements, Mon Équipe).
 * Fournit Header + GameNav + wrapper de page.
 * Les pages enfants n'ont donc plus besoin de leur propre Header.
 */
export default function GameLayout({ children }) {
    return (
        <div className="min-h-screen bg-f1-dark text-f1-white flex flex-col">
            <Header />
            <GameNav />
            <main className="flex-1 flex flex-col">
                {children}
            </main>
        </div>
    );
}
