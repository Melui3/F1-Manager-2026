import React from "react";

/**
 * Carte F1 réutilisable.
 *
 * @param {boolean} stripe   - Ajoute la bande rouge en haut
 * @param {string}  className
 */
export default function Card({ stripe = false, className = "", children, ...props }) {
    return (
        <div
            className={[
                "f1-card",
                stripe ? "f1-stripe" : "",
                className,
            ].filter(Boolean).join(" ")}
            {...props}
        >
            {children}
        </div>
    );
}
