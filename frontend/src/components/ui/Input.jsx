import React from "react";

/**
 * Champ de saisie F1.
 * Supporte type="text", "password", "email", etc.
 *
 * @param {string}  label     - Label affiché au-dessus (optionnel)
 * @param {string}  className - Classes supplémentaires sur le wrapper
 */
export default function Input({ label, className = "", wrapperClassName = "", ...props }) {
    return (
        <div className={wrapperClassName}>
            {label && <label className="f1-label">{label}</label>}
            <input className={`f1-input ${className}`} {...props} />
        </div>
    );
}

/**
 * Select F1 stylisé (même base que Input).
 *
 * @param {string} label
 */
export function Select({ label, className = "", wrapperClassName = "", children, ...props }) {
    return (
        <div className={wrapperClassName}>
            {label && <label className="f1-label">{label}</label>}
            <select className={`f1-input ${className}`} {...props}>
                {children}
            </select>
        </div>
    );
}
