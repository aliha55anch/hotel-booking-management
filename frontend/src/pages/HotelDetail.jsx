import Button from '../components/ui/Button.jsx'

export default function HotelDetail() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-ink">Hotel details</h1>
      <p className="mt-2 text-sm text-muted">Coming soon.</p>
      <div className="mt-6">
        <Button to="/hotels" variant="secondary">
          Back to hotels
        </Button>
      </div>
    </section>
  )
}
