import { cn } from '../../lib/utils';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface WebGLErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface WebGLErrorBoundaryState {
  hasError: boolean;
}

export class WebGLErrorBoundary extends Component<WebGLErrorBoundaryProps, WebGLErrorBoundaryState> {
  public state: WebGLErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): WebGLErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <WebGLFallback />;
    }
    return this.props.children;
  }
}

interface WebGLFallbackProps {
  className?: string;
  message?: string;
}

export function WebGLFallback({
  className,
  message = 'Interactive WebGL content is unavailable on this device/browser.',
}: WebGLFallbackProps) {
  return (
    <div
      className={cn(
        'h-full w-full bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_58%,#ca8a04_140%)]',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{message}</span>
    </div>
  );
}
