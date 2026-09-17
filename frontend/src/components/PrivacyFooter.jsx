import { Download, ExternalLink, HardDrive, ShieldCheck, Trash2 } from "lucide-react";

const CNIL_RIGHTS_URL = "https://www.cnil.fr/fr/mes-demarches/les-droits-pour-maitriser-vos-donnees-personnelles";

function FooterPill({ icon: Icon, children }) {
    const iconNode = Icon ? <Icon className="h-3.5 w-3.5 text-f1-red" aria-hidden="true" /> : null;

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-f1-border bg-f1-dark/60 px-2.5 py-1 text-[11px] font-semibold text-f1-silver">
            {iconNode}
            {children}
        </span>
    );
}

export default function PrivacyFooter() {
    return (
        <footer className="border-t border-f1-border bg-f1-dark/95 px-5 py-5 text-f1-silver">
            <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-2 font-f1-display text-xs font-bold uppercase tracking-widest text-f1-white">
                        <ShieldCheck className="h-4 w-4 text-f1-red" aria-hidden="true" />
                        RGPD & vie privee
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-f1-muted">
                        La sauvegarde, le budget, les choix d'ecurie et les resultats restent dans le stockage local de ce navigateur.
                        {" "}Tu peux exporter tes donnees, changer de session ou supprimer la sauvegarde locale depuis Mon equipe.
                    </p>
                </div>

                <div className="flex flex-col gap-3 lg:items-end">
                    <div className="flex flex-wrap gap-2">
                        <FooterPill icon={HardDrive}>Stockage local</FooterPill>
                        <FooterPill icon={Download}>Export JSON</FooterPill>
                        <FooterPill icon={Trash2}>Suppression locale</FooterPill>
                    </div>
                    <a
                        href={CNIL_RIGHTS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-f1-silver underline-offset-4 hover:text-f1-white hover:underline"
                    >
                        Comprendre les droits RGPD
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                </div>
            </div>
        </footer>
    );
}
