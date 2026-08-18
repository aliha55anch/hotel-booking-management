import { useEffect, useRef, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import { PencilIcon, MailIcon } from '../components/ui/icons.jsx'
import { getMyProfile, updateMyProfile } from '../services/userService.js'
import { getApiErrorMessage } from '../lib/errors.js'
import { inputClass, labelClass } from '../components/admin/formClasses.js'
import { useAuth } from '../context/AuthContext.jsx'

const MAX_IMAGE_SIZE = 512

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function resizeImage(dataUrl, maxSize) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const width = Math.round(img.width * scale)
      const height = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

function ProfileSkeleton() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="h-8 w-40 animate-pulse rounded bg-surface" />
      <div className="mt-6 h-64 animate-pulse rounded-card bg-surface" />
    </section>
  )
}

function ProfileContent({ token }) {
  const [user, setUser] = useState(null)
  const [name, setName] = useState('')
  const [image, setImage] = useState('')
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const fileRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getMyProfile(token)
      .then((data) => {
        if (cancelled) return
        setUser(data.user)
        setName(data.user?.name || '')
        setImage(data.user?.image || '')
        setPreview(data.user?.image || '')
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load your profile'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, reloadKey])

  const handleFile = async (file) => {
    if (!file) return
    setFormError(null)

    const dataUrl = await fileToDataUrl(file)
    const resized = await resizeImage(dataUrl, MAX_IMAGE_SIZE)

    if (!resized) {
      setFormError('Could not read that image. Try another file.')
      return
    }

    setImage(resized)
    setPreview(resized)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    setSaved(false)

    try {
      const { user: updated } = await updateMyProfile(
        { name: name.trim(), image: image.trim() || undefined },
        token
      )
      setUser(updated)
      setPreview(updated.image || '')
      setSaved(true)
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not save your profile'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <ProfileSkeleton />

  if (error) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-semibold text-ink sm:text-3xl">Profile</h1>
        <div className="mt-6 flex items-center justify-between rounded-card border border-line bg-surface p-4">
          <p className="text-sm text-error">{error}</p>
          <Button size="sm" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-semibold text-ink sm:text-3xl">Profile</h1>
      <p className="mt-1 text-sm text-muted">Update your display name and profile photo.</p>

      <form onSubmit={handleSave} className="mt-6 space-y-6 rounded-card border border-line bg-background p-4 shadow-card sm:p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-primary/30"
            />
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-soft text-2xl font-semibold text-primary">
              {(name || user?.name || 'U').charAt(0).toUpperCase()}
            </span>
          )}

          <div className="flex flex-col gap-2">
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              <PencilIcon className="h-4 w-4" />
              Choose photo
            </Button>
            {image && image.startsWith('data:') && (
              <Button size="sm" variant="ghost" onClick={() => { setImage(''); setPreview('') }}>
                Remove photo
              </Button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        </div>

        <label className="block">
          <span className={labelClass}>Photo URL</span>
          <input
            className={inputClass}
            placeholder="https://example.com/photo.jpg"
            value={image.startsWith('data:') ? '' : image}
            onChange={(e) => setImage(e.target.value)}
          />
          <span className="mt-1 block text-xs text-muted">
            Pick a file above, or paste an image URL. Photos are saved as a small thumbnail.
          </span>
        </label>

        <label className="block">
          <span className={labelClass}>Name</span>
          <input
            className={inputClass}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        {user?.email && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <MailIcon className="h-4 w-4" />
            {user.email}
          </p>
        )}

        {formError && <p className="text-sm text-error">{formError}</p>}
        {saved && <p className="text-sm text-primary">Profile saved.</p>}

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </section>
  )
}

export default function Profile() {
  const { token, loading } = useAuth()
  if (loading) return <ProfileSkeleton />
  return <ProfileContent token={token} />
}
