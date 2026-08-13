import { Link } from 'react-router-dom'

const base =
  'inline-flex items-center justify-center gap-2 rounded-btn font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50'

const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-12 px-8 text-base',
}

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  secondary: 'bg-transparent text-primary border border-primary hover:bg-primary-soft',
  accent: 'bg-accent text-ink hover:brightness-95',
  ghost: 'bg-transparent text-ink hover:bg-surface',
  danger: 'bg-error text-white hover:bg-error/90',
}

function Button({ to, href, variant = 'primary', size = 'md', className = '', type, children, ...props }) {
  const classes = `${base} ${sizes[size]} ${variants[variant]} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button type={type || 'button'} className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button
