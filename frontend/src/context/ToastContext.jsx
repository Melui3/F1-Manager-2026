import { createContext, useCallback, useContext, useState } from "react";

const ToastCtx = createContext({ addToast: () => {} });

const STYLES = {
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    error:   "border-f1-red/40 bg-f1-red/10 text-red-300",
    info:    "border-sky-500/40 bg-sky-500/10 text-sky-300",
    warning: "border-f1-yellow/40 bg-f1-yellow/10 text-f1-yellow",
};

const ICONS = { success: "✓", error: "✗", info: "●", warning: "▲" };

function ToastItem({ toast, onDismiss }) {
    return (
        <div
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm f1-fade-in cursor-pointer select-none font-f1 ${STYLES[toast.type] ?? STYLES.info}`}
            onClick={() => onDismiss(toast.id)}
        >
            <span className="font-bold shrink-0 mt-0.5">{ICONS[toast.type]}</span>
            <div className="flex-1 min-w-0 leading-snug">{toast.message}</div>
        </div>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

    const addToast = useCallback(({ message, type = "info", duration = 4000 }) => {
        const id = Date.now() + Math.random();
        setToasts((t) => [...t, { id, message, type }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
    }, []);

    return (
        <ToastCtx.Provider value={{ addToast }}>
            {children}
            {toasts.length > 0 && (
                <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                    {toasts.map((t) => (
                        <div key={t.id} className="pointer-events-auto">
                            <ToastItem toast={t} onDismiss={dismiss} />
                        </div>
                    ))}
                </div>
            )}
        </ToastCtx.Provider>
    );
}

export function useToast() {
    return useContext(ToastCtx);
}
