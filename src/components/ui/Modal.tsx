import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    className?: string; // For the modal panel
    showCloseButton?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    children,
    title,
    className,
    showCloseButton = true
}: ModalProps) {
    const bodyRef = useRef(document.body);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden"; // Prevent background scrolling
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Panel */}
            <div
                className={cn(
                    "relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col",
                    className
                )}
                role="dialog"
                aria-modal="true"
            >
                {/* Header (Optional) */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                        {title && (
                            <h2 className="text-lg font-semibold text-slate-900 leading-6">
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition ml-auto"
                                aria-label="Cerrar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className={cn("flex-1 min-h-0", !title ? "" : "")}>
                    {children}
                </div>
            </div>
        </div>,
        bodyRef.current
    );
}
