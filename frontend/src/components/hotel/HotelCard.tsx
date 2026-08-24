import { Link } from 'react-router-dom'
import { HotelIcon, MapPinIcon, StarIcon } from '../ui/icons'
import { formatPrice } from '../../lib/format'
import { useCurrency } from '../../context/CurrencyContext'
import { hotelImageFor } from '../../lib/siteImages'
import type { Hotel } from '@/types'

interface HotelCardProps {
  hotel: Hotel & { priceFrom?: number }
  image?: string
}

export default function HotelCard({ hotel, image }: HotelCardProps) {
  const { currency } = useCurrency()
  const src = image || hotelImageFor(hotel)

  return (
    <Link
      to={`/hotels/${hotel._id}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-background shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="relative aspect-16/10 w-full overflow-hidden bg-surface">
        {src ? (
          <img
            src={src}
            alt={hotel.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary-soft to-primary/10 text-primary">
            <HotelIcon className="h-10 w-10" />
          </div>
        )}
        {(hotel.rating ?? 0) > 0 && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-btn bg-background/90 px-2 py-0.5 text-xs font-semibold text-ink shadow-sm backdrop-blur-sm">
            <StarIcon className="h-3.5 w-3.5 text-accent" />
            {hotel.rating}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 font-heading text-sm sm:text-base font-semibold leading-snug text-ink">{hotel.name}</h3>
        <p className="flex items-center gap-1 text-xs text-muted">
          <MapPinIcon className="h-3.5 w-3.5" />
          {hotel.city}
        </p>
        <div className="mt-auto flex items-baseline justify-between border-t border-line pt-3">
          {hotel.priceFrom ? (
            <>
              <span className="text-lg font-semibold text-primary">{formatPrice(hotel.priceFrom, currency)}</span>
              <span className="text-xs text-muted"> / night</span>
            </>
          ) : (
            <span className="text-sm text-muted">View rooms</span>
          )}
        </div>
      </div>
    </Link>
  )
}
