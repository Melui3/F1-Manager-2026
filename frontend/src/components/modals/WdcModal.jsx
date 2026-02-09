import React from "react";

export default function Modal({ open, title, onClose, children, footer, maxWidth = "max-w-3xl" }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />

            <div className={`relative w-full ${maxWidth} rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl`}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                    <h3 className="text-lg font-extrabold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200"
                    >
                        Fermer
                    </button>
                </div>

                <div className="p-5 max-h-[70vh] overflow-auto">{children}</div>

                {footer && <div className="px-5 py-4 border-t border-gray-800">{footer}</div>}
            </div>
        </div>
    );
}