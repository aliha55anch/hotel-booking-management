import {
  CarIcon,
  UtensilsIcon,
  DumbbellIcon,
  CoffeeIcon,
  BathIcon,
  EyeIcon,
  FlameIcon,
  ShuttleIcon,
  CheckIcon,
} from '../ui/icons.jsx'

const amenityMap = [
  { match: /restaurant|dining|food/i, Icon: UtensilsIcon },
  { match: /gym|fitness|workout/i, Icon: DumbbellIcon },
  { match: /coffee|cafe|bar|kitchen/i, Icon: CoffeeIcon },
  { match: /bath|tub|shower/i, Icon: BathIcon },
  { match: /view|balcony|terrace|city/i, Icon: EyeIcon },
  { match: /parking|park|garage/i, Icon: CarIcon },
  { match: /fireplace|heater|fire|warm/i, Icon: FlameIcon },
  { match: /shuttle|airport|transfer/i, Icon: ShuttleIcon },
]

const iconFor = (amenity) => {
  const entry = amenityMap.find(({ match }) => match.test(amenity))
  return entry ? entry.Icon : CheckIcon
}

export default function AmenitiesList({ amenities = [], limit }) {
  const items = limit ? amenities.slice(0, limit) : amenities

  if (!items.length) return null

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((amenity) => {
        const Icon = iconFor(amenity)
        return (
          <li
            key={amenity}
            className="flex items-center gap-1.5 rounded-btn bg-surface px-2.5 py-1 text-xs font-medium text-muted"
          >
            <Icon className="h-3.5 w-3.5" />
            {amenity}
          </li>
        )
      })}
    </ul>
  )
}
