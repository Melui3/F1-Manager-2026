import React from "react";

const STYLES = {
    success: "border-f1-teal/30  bg-f1-teal/10  text-f1-teal",
    info:    "border-sky-500/30  bg-sky-500/10  text-sky-300",
    error:   "border-f1-red/30   bg-f1-red/10   text-red-300",
    warning: "border-f1-yellow/30 bg-f1-yellow/10 text-yellow-300",
};

/**
 * Alerte / message F1.
 *
 * @param {"success"|"info"|"error"|"warning"} type
 */
export default function Alert({ type = "error", className = "", children }) {
    return (
        <div
            className={[
                "px-4 py-3 text-sm rounded-xl border font-semibold f1-fade-in",
                STYLES[type] ?? STYLES.error,
                className,
            ].join(" ")}
        >
            {children}
        </div>
    );
}
