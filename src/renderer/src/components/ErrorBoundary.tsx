import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[Ready Set Post] UI error', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="app-error-fallback">
          <h1>Something went wrong</h1>
          <p className="muted small">{this.state.error.message}</p>
          <button
            type="button"
            className="primary"
            onClick={() => {
              this.setState({ error: null })
              window.location.reload()
            }}
          >
            Reload app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
