import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {}

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AlgoDrishti UI error', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="app-error">
        <section>
          <h1>Something went wrong</h1>
          <p>The visualizer hit a UI error, but the page stayed alive. Reload to return to the workspace.</p>
          <pre>{this.state.error.message}</pre>
          <button type="button" onClick={() => window.location.reload()}>
            Reload app
          </button>
        </section>
      </main>
    )
  }
}
