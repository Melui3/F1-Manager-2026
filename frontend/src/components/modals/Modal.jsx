import { useEffect } from "react";

export default function Modal({ open, title, onClose, children, footer, maxWidth = "max-w-3xl" }) {
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

            <div className={`relative w-full ${maxWidth} rounded-2xl border border-f1-border bg-f1-surface shadow-2xl f1-fade-in`}>
                {/* Red stripe accent */}
                <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-f1-red" />

                <div className="flex items-center justify-between px-6 py-4 border-b border-f1-border">
                    <h3 className="font-f1-display text-base font-bold text-f1-white tracking-wide">{title}</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-f1-surface-2 hover:bg-f1-border text-f1-silver hover:text-f1-white transition-colors text-lg leading-none"
                        aria-label="Fermer"
                    >
                        ×
                    </button>
                </div>

                <div className="p-5 max-h-[70vh] overflow-auto">{children}</div>

                {footer && (
                    <div className="px-6 py-4 border-t border-f1-border bg-f1-dark/40 rounded-b-2xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
