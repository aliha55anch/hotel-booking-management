import { Link } from 'react-router-dom'
import { HotelIcon, MapPinIcon, StarIcon } from '../ui/icons.jsx'

export default function HotelCard({ hotel }) {
  const image = hotel.images?.[0]

  return (
    <Link
      to={`/hotels/${hotel._id}`}
      className="group block overflow-hidden rounded-card border border-line bg-background shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="aspect-16/10 w-full overflow-hidden bg-surface">
        {image ? (
          <img
            src={image}
            alt={hotel.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <HotelIcon className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg font-semibold text-ink">{hotel.name}</h3>
          {hotel.rating > 0 && (
            <span className="flex shrink-0 items-center gap-1 rounded-btn bg-accent px-2 py-0.5 text-xs font-semibold text-ink">
              <StarIcon className="h-3.5 w-3.5" />
              {hotel.rating}
            </span>
          )}
        </div>

        <p className="mt-1 flex items-center gap-1 text-sm text-muted">
          <MapPinIcon className="h-4 w-4" />
          {hotel.city}
        </p>

        <p className="mt-3 text-sm">
          {hotel.priceFrom ? (
            <>
              <span className="text-lg font-semibold text-primary">${hotel.priceFrom}</span>
              <span className="text-muted"> / night</span>
            </>
          ) : (
            <span className="text-muted">View rooms</span>
          )}
        </p>
      </div>
    </Link>
  )
}
