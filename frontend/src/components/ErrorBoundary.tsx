import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('oceaneye_user_gmaps_key');
    } catch {}
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full h-full min-h-[420px] rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col items-center justify-center text-center font-poppins text-white">
          <div className="max-w-md w-full bg-slate-950/90 backdrop-blur-md p-6 rounded-2xl border border-red-500/30 shadow-2xl">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-100 mb-1.5">
              {this.props.componentName ? `${this.props.componentName} Unavailable` : 'Component Error'}
            </h3>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {this.state.error?.message?.includes('Google') || this.state.error?.message?.includes('maps')
                ? 'The map failed to initialize with the current key. Please verify your Google Maps Platform API key or use the built-in INCOIS Vector Chart.'
                : (this.state.error?.message || 'An unexpected rendering error occurred in this view.')}
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset & Reload</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('oceaneye_user_gmaps_key');
                  } catch {}
                  window.location.reload();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Clear Stored Keys
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
