import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Plain (no Sentry dependency) so it's available synchronously for the very
// first render — Sentry itself loads later, off the critical rendering path
// (see main.tsx), and is reported to lazily here if it's ready by the time
// an error actually happens.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    import('./monitoring').then(({ reportError }) => reportError(error, info));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-pure text-white text-center px-6">
          <div>
            <p className="text-xl font-bold mb-2">Something went wrong.</p>
            <p className="text-secondary-text text-sm">Please refresh the page. Our team has been notified.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
