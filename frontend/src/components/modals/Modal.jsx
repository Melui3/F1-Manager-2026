import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({ open, title, onClose, children, footer, maxWidth = "max-w-3xl" }) {
    const dialogRef = useRef(null);
    const titleId = useId();
    const closeRef = useRef(onClose);
    closeRef.current = onClose;
    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        dialogRef.current.showModal();
        return () => {
            document.body.style.overflow = overflow;
            if (previous?.isConnected) previous.focus();
        };
    }, [open]);

    if (!open) return null;

    return (
        <dialog ref={dialogRef} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); closeRef.current(); }} className="fixed inset-0 z-[9999] w-full h-full max-w-none max-h-none m-0 bg-transparent text-f1-white flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

            <div className={`relative w-full ${maxWidth} rounded-2xl border border-f1-border bg-f1-surface shadow-2xl f1-fade-in`}>
                {/* Red stripe accent */}
                <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-f1-red" />

                <div className="flex items-center justify-between px-6 py-4 border-b border-f1-border">
                    <h3 id={titleId} className="font-f1-display text-base font-bold text-f1-white tracking-wide">{title}</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-f1-surface-2 hover:bg-f1-border text-f1-silver hover:text-f1-white transition-colors text-lg leading-none"
                        aria-label="Fermer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 max-h-[70vh] overflow-auto">{children}</div>

                {footer && (
                    <div className="px-6 py-4 border-t border-f1-border bg-f1-dark/40 rounded-b-2xl">
                        {footer}
                    </div>
                )}
            </div>
        </dialog>
    );
}
