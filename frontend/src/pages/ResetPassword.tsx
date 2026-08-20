import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import { FaviconIcon, EyeIcon, EyeOffIcon } from '../components/ui/icons'
import { inputClass, labelClass } from '../components/admin/formClasses'
import { resetPassword } from '../services/authService'
import { getApiErrorMessage } from '../lib/errors'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!/^\d{6}$/.test(code)) {
      setError('Please enter the 6-digit code from your email')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError('Password must include uppercase, lowercase, a number, and a special character')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      await resetPassword({ email: email.trim(), code: code.trim(), newPassword: password })
      navigate('/login', { replace: true })
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not reset your password'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <FaviconIcon className="h-10 w-auto text-primary" />
          <h1 className="font-heading text-3xl font-semibold text-ink">Reset your password</h1>
          <p className="text-sm text-muted">
            Enter the 6-digit code we emailed you and choose a new password.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-card border border-line bg-background p-6 shadow-card"
        >
          <label className="block">
            <span className={labelClass}>Email</span>
            <input
              className={inputClass}
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            />
          </label>

          <label className="block">
            <span className={labelClass}>6-digit code</span>
            <input
              className={`${inputClass} tracking-[0.3em]`}
              inputMode="numeric"
              maxLength={6}
              required
              autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </label>

          <label className="block">
            <span className={labelClass}>New password</span>
            <div className="relative">
              <input
                className={`${inputClass} pr-11`}
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="At least 8 chars, A-Z, a-z, 0-9, special"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className={labelClass}>Confirm new password</span>
            <div className="relative">
              <input
                className={`${inputClass} pr-11`}
                type={showConfirm ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </label>

          {error && <p className="text-sm text-error">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Resetting...' : 'Reset password'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  )
}
