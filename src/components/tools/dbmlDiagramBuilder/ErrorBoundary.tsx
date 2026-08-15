import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * The diagram canvas renders arbitrary parsed schema data through React Flow;
 * a hostile or unexpected shape shouldn't take the whole app down. DBML text
 * itself is safe in localStorage regardless of what happens here, so
 * recovery is just a reload — see brief section 38.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('DBML diagram builder crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-white">
          <div className="text-center max-w-sm px-6">
            <p className="text-sm font-semibold text-slate-700">Something went wrong.</p>
            <p className="mt-1 text-sm text-slate-500">
              The diagram hit a rendering error. Your DBML is safe in this browser's storage.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white"
            >
              <RefreshCw size={14} />
              Reload the diagram
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
