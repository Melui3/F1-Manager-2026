import Modal from "./Modal";
import Button from "../ui/Button";

export default function ConfirmModal({
    open,
    title,
    children,
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    danger = false,
    loading = false,
    onConfirm,
    onClose,
}) {
    return (
        <Modal
            open={open}
            title={title}
            onClose={onClose}
            maxWidth="max-w-xl"
            footer={
                <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
                        {confirmLabel}
                    </Button>
                </div>
            }
        >
            <div className="text-sm text-f1-silver leading-relaxed">
                {children}
            </div>
        </Modal>
    );
}
