import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

// React 19 bundles no .d.ts, so Component<P,S> resolves as any. We declare
// lifecycle hooks directly to give TypeScript proper type coverage.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, retryCount: 0 };


  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, info);
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.hasError) {
      const fallback = this.props.fallback;
      if (fallback !== undefined) return fallback;
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-carbon/20 border border-graphite/40 rounded-xl p-6 max-w-md text-center">
            <div className="text-ash/40 text-4xl mb-3">⚠</div>
            <h2 className="text-bone font-semibold text-sm uppercase tracking-wider mb-2">
              Component Error
            </h2>
            <p className="text-ash/60 text-xs font-mono mb-3">
              {this.state.error?.message || 'Unknown error'}
            </p>
            {this.state.retryCount >= 3 ? (
              <span className="text-[10px] uppercase tracking-widest text-ash/40">Max retries exceeded</span>
            ) : (
              <button
                onClick={() => this.setState(prev => ({ hasError: false, error: null, retryCount: prev.retryCount + 1 }))}
                className="text-[10px] uppercase tracking-widest text-signal-cyan hover:text-bone transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

(ErrorBoundary as any).displayName = 'ErrorBoundary';
