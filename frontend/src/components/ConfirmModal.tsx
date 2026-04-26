interface ConfirmModalProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal = ({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
}: ConfirmModalProps) => {
  if (!open) return null;

  return (
    <div className="modal modal-blur fade show d-block" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button className="btn-close" type="button" onClick={onClose} aria-label="Close" />
          </div>
          <div className="modal-body">{body}</div>
          <div className="modal-footer">
            <button className="btn btn-link link-secondary me-auto" type="button" onClick={onClose}>
              {cancelLabel}
            </button>
            <button className="btn btn-danger" type="button" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

