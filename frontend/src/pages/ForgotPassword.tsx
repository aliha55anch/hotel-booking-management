import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import { FaviconIcon, CheckIcon } from '../components/ui/icons'
import { inputClass, labelClass } from '../components/admin/formClasses'
import { forgotPassword } from '../services/authService'
import { getApiErrorMessage } from '../lib/errors'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      const data = await forgotPassword({ email: email.trim() })
      setSuccess(data.message || 'A password reset code has been sent to your email.')
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not send the reset code'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <FaviconIcon className="h-10 w-auto text-primary" />
          <h1 className="font-heading text-3xl font-semibold text-ink">Forgot your password?</h1>
          <p className="text-sm text-muted">
            Enter your email and we will send you a 6-digit code to reset your password.
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

          {error && <p className="text-sm text-error">{error}</p>}

          {success && (
            <p className="flex items-start gap-2 rounded-card border border-line bg-surface p-4 text-sm text-ink">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {success}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Sending code...' : 'Send reset code'}
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
