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
import { assets } from '../../assets/assets.js'

const assetMap = [
  { match: /free wifi|wifi/i, src: assets.freeWifiIcon },
  { match: /free breakfast|breakfast/i, src: assets.freeBreakfastIcon },
  { match: /room service/i, src: assets.roomServiceIcon },
  { match: /mountain view/i, src: assets.mountainIcon },
  { match: /pool access|pool/i, src: assets.poolIcon },
]

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

const assetFor = (amenity) => {
  const entry = assetMap.find(({ match }) => match.test(amenity))
  return entry ? entry.src : null
}

export default function AmenitiesList({ amenities = [], limit }) {
  const items = limit ? amenities.slice(0, limit) : amenities

  if (!items.length) return null

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((amenity) => {
        const assetSrc = assetFor(amenity)
        const Icon = iconFor(amenity)
        return (
          <li
            key={amenity}
            className="flex items-center gap-1.5 rounded-btn bg-surface px-2.5 py-1 text-xs font-medium text-muted"
          >
            {assetSrc ? (
              <img src={assetSrc} alt="" className="h-3.5 w-3.5" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
            {amenity}
          </li>
        )
      })}
    </ul>
  )
}
