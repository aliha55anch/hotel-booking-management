import { useEffect, useState } from 'react'
import PageHeader from '../../components/admin/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import { UsersIcon, TrashIcon } from '../../components/ui/icons.jsx'
import { getAllUsers, updateUserRole, deleteUser } from '../../services/userService.js'
import { getApiErrorMessage } from '../../lib/errors.js'
import { useAdmin } from '../../components/admin/adminContext.js'

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'hotelOwner', label: 'Hotel owner' },
  { value: 'admin', label: 'Admin' },
]

const selectClass =
  'h-9 rounded-btn border border-line bg-background px-2 text-xs font-medium text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'

export default function ManageUsers() {
  const { token, user: me } = useAdmin()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState(null)

  const load = () => setReloadKey((key) => key + 1)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getAllUsers(token)
      .then((data) => {
        if (!cancelled) setUsers(data.users || [])
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load users'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, reloadKey])

  const handleRoleChange = async (user, role) => {
    setActionError(null)
    try {
      const { user: updated } = await updateUserRole(user._id, { role }, token)
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)))
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not update the role'))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setActionError(null)

    try {
      await deleteUser(deleteTarget._id, token)
      setDeleteTarget(null)
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id))
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not delete the user'))
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle={`${users.length} user${users.length === 1 ? '' : 's'} on the platform`}>
        <Button size="sm" onClick={() => setReloadKey((key) => key + 1)}>
          Refresh
        </Button>
      </PageHeader>

      {error && (
        <div className="flex items-center justify-between rounded-card border border-line bg-surface p-4">
          <p className="text-sm text-error">{error}</p>
          <Button size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {actionError && <p className="text-sm text-error">{actionError}</p>}

      {loading ? (
        <div className="h-64 animate-pulse rounded-card bg-surface" />
      ) : users.length > 0 ? (
        <div className="overflow-x-auto rounded-card border border-line bg-background shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((user) => {
                const isSelf = user.clerkId === me?.clerkId
                return (
                  <tr key={user._id} className="hover:bg-surface/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium text-ink">
                            {user.name || '—'}
                            {isSelf && <span className="ml-2 text-xs text-muted">(you)</span>}
                          </p>
                          <p className="text-xs text-muted">{user.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted md:table-cell">{user.email || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={isSelf}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                        className={selectClass}
                      >
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {isSelf ? (
                          <span className="text-xs text-muted">Self</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(user)}
                            aria-label={`Delete ${user.name || 'user'}`}
                            className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors hover:bg-error/10 hover:text-error"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-btn bg-primary-soft text-primary">
            <UsersIcon className="h-7 w-7" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-ink">No users yet</h2>
            <p className="mt-1 text-sm text-muted">Users appear here once they sign up through Clerk.</p>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user?"
        message={`This will permanently delete "${deleteTarget?.name || 'this user'}" along with their bookings and remove them as the owner of any hotels. This cannot be undone.`}
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
