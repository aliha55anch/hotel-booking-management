import { useEffect, useState } from 'react'
import PageHeader from '../../components/admin/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import OfferForm from '../../components/admin/OfferForm.jsx'
import { PlusIcon, PencilIcon, TrashIcon, FlameIcon, BedIcon } from '../../components/ui/icons.jsx'
import { getAllOffers, deleteOffer } from '../../services/offerService.js'
import { getApiErrorMessage } from '../../lib/errors.js'
import { useAdmin } from '../../components/admin/adminContext.js'

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function OfferRow({ offer, onEdit, onDelete }) {
  return (
    <tr className="hover:bg-surface/60">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-btn bg-linear-to-br from-primary-soft to-primary/10 text-primary">
            {offer.image ? (
              <img src={offer.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <FlameIcon className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{offer.title}</p>
            <p className="truncate text-xs text-muted">{offer.packageOptions?.length || 0} package option(s)</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {offer.discountPercent > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-btn bg-error/10 px-2 py-0.5 text-xs font-semibold text-error">
            <FlameIcon className="h-3 w-3" />
            {offer.discountPercent}% OFF
          </span>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-1.5 text-sm text-muted">
          <BedIcon className="h-4 w-4" />
          {formatDate(offer.expiryDate)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 rounded-btn px-2 py-0.5 text-xs font-semibold ${
            offer.active ? 'bg-primary-soft text-primary' : 'bg-surface text-muted'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${offer.active ? 'bg-primary' : 'bg-muted'}`} />
          {offer.active ? 'Active' : 'Hidden'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(offer)}
            aria-label={`Edit ${offer.title}`}
            className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface hover:text-primary"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(offer)}
            aria-label={`Delete ${offer.title}`}
            className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors hover:bg-error/10 hover:text-error"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function ManageOffers() {
  const { token } = useAdmin()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState(null)

  const load = () => setReloadKey((key) => key + 1)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getAllOffers(token)
      .then((data) => {
        if (!cancelled) setOffers(data.offers || [])
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load offers'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reloadKey, token])

  const handleSaved = () => {
    setFormOpen(false)
    setEditingOffer(null)
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setActionError(null)

    try {
      await deleteOffer(deleteTarget._id, token)
      setDeleteTarget(null)
      load()
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not delete the offer'))
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Offers" subtitle={`${offers.length} exclusive offer${offers.length === 1 ? '' : 's'}`}>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <PlusIcon className="h-4 w-4" />
          Add offer
        </Button>
      </PageHeader>

      {actionError && <p className="text-sm text-error">{actionError}</p>}

      {error && (
        <div className="flex items-center justify-between rounded-card border border-line bg-surface p-4">
          <p className="text-sm text-error">{error}</p>
          <Button size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-card bg-surface" />
      ) : offers.length > 0 ? (
        <div className="overflow-x-auto rounded-card border border-line bg-background shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Offer</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {offers.map((offer) => (
                <OfferRow
                  key={offer._id}
                  offer={offer}
                  onEdit={(offer) => {
                    setEditingOffer(offer)
                    setFormOpen(true)
                  }}
                  onDelete={setDeleteTarget}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-btn bg-primary-soft text-primary">
            <FlameIcon className="h-7 w-7" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-ink">No offers yet</h2>
            <p className="mt-1 text-sm text-muted">Create your first exclusive offer to promote your packages.</p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Add offer
          </Button>
        </div>
      )}

      <OfferForm
        open={formOpen}
        offer={editingOffer}
        token={token}
        onClose={() => {
          setFormOpen(false)
          setEditingOffer(null)
        }}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete offer?"
        message={`This will permanently delete "${deleteTarget?.title}". This cannot be undone.`}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null)
          setDeleting(false)
        }}
      />
    </div>
  )
}
