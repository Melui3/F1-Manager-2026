import React from "react";

const VARIANTS = {
    primary:   "bg-f1-red hover:bg-f1-red-dark text-white shadow-sm shadow-f1-red/20",
    secondary: "bg-f1-surface-2 hover:bg-f1-border text-f1-white border border-f1-border",
    ghost:     "bg-transparent hover:bg-f1-surface-2 text-f1-white",
    outline:   "bg-transparent hover:bg-f1-red/10 text-f1-red border border-f1-red/40 hover:border-f1-red",
    danger:    "bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-500/30",
};

const SIZES = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
    xl: "px-8 py-4 text-lg gap-3",
};

/**
 * Bouton F1 réutilisable.
 *
 * @param {"primary"|"secondary"|"ghost"|"outline"|"danger"} variant
 * @param {"sm"|"md"|"lg"|"xl"} size
 * @param {boolean} loading  - affiche un spinner et désactive le bouton
 * @param {boolean} fullWidth
 */
export default function Button({
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    children,
    className = "",
    ...props
}) {
    const classes = [
        "font-f1 font-semibold rounded-xl transition-all duration-150",
        "inline-flex items-center justify-center cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        fullWidth ? "w-full" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button className={classes} disabled={loading || props.disabled} {...props}>
            {loading && <span className="f1-spinner" />}
            {children}
        </button>
    );
}
