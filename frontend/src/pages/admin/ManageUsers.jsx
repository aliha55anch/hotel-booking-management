import { useEffect, useState } from 'react'
import PageHeader from '../../components/admin/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import { UsersIcon } from '../../components/ui/icons.jsx'
import { getAllUsers } from '../../services/userService.js'
import { getApiErrorMessage } from '../../lib/errors.js'
import { useAdmin } from '../../components/admin/adminContext.js'

const roleStyles = {
  admin: 'bg-primary-soft text-primary',
  guest: 'bg-gray-100 text-gray-600',
}

export default function ManageUsers() {
  const { token } = useAdmin()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

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
          <Button size="sm" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </Button>
        </div>
      )}

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
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img src={user.image} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                      <p className="font-medium text-ink">{user.name || '—'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{user.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-btn px-2.5 py-0.5 text-xs font-semibold capitalize ${roleStyles[user.role] || roleStyles.guest}`}>
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}
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
    </div>
  )
}
