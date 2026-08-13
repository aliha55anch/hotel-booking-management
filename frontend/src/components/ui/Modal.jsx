import { CloseIcon } from './icons.jsx'

export default function Modal({ open, title, onClose, children, footer, maxWidth = 'max-w-lg' }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-card border border-line bg-background p-6 shadow-card-hover`}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-lg font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
