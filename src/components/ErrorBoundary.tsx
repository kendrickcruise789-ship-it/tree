import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Rambagh Application Error Caught:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1E1B18] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#EDE6DC] p-8 text-center shadow-lg space-y-5">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF7F2] border border-[#E8DDD1] flex items-center justify-center text-[#A8523C]">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <span className="font-serif text-2xl tracking-[0.2em] font-medium text-[#1E1B18] uppercase block">
                RAMBAGH
              </span>
              <h1 className="font-serif text-xl font-normal text-[#1E1B18]">
                Something interrupted your session
              </h1>
              <p className="text-xs text-[#7A6B5D] leading-relaxed">
                We encountered an unexpected interface issue. Please click below to refresh the atelier view.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-[#FAF7F2] border border-[#EDE6DC] text-[11px] font-mono text-[#7A6B5D] text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-[#1E1B18] text-[#FDFBF7] text-xs uppercase tracking-widest font-medium hover:bg-[#342F2A] transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload Rambagh Atelier</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
