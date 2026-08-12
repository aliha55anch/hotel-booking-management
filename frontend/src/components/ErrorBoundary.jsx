import { Component } from 'react'
import Button from './ui/Button.jsx'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-md rounded-card border border-line bg-background p-6 text-center shadow-card">
            <h1 className="font-heading text-xl font-semibold text-ink">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted">
              The app hit an unexpected error. Check that your environment keys are configured
              correctly, then reload.
            </p>
            <div className="mt-6">
              <Button onClick={() => window.location.reload()}>Reload</Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
