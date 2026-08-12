import Button from '../components/ui/Button.jsx'

export default function NotFound() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-muted">The page you're looking for doesn't exist.</p>
      <div className="mt-6">
        <Button to="/">Back home</Button>
      </div>
    </section>
  )
}
