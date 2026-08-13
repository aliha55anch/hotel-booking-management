import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="ghost" disabled={busy} onClick={onCancel}>
            Keep
          </Button>
          <Button variant="danger" disabled={busy} onClick={onConfirm}>
            {busy ? 'Deleting...' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">{message}</p>
    </Modal>
  )
}
