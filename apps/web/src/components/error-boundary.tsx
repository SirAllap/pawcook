import { Component, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

class ErrorBoundaryBase extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // Surface to the console for debugging; we don't ship telemetry.
    console.error('App error boundary caught:', error, info);
  }

  reset = () => this.setState({ error: null });

  resetLocalData = () => {
    try {
      const keys = Object.keys(window.localStorage).filter((k) =>
        k.startsWith('pawcook_'),
      );
      for (const k of keys) window.localStorage.removeItem(k);
    } catch {
      // ignore quota / private-mode failures
    }
    window.location.reload();
  };

  render() {
    const { t, children } = this.props;
    if (!this.state.error) return children;
    return (
      <div className="mx-auto max-w-xl py-10 px-4">
        <Card padding="lg" variant="elevated" className="space-y-4 border-l-[3px] border-l-danger">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-black tracking-tight">
              {t('errorBoundary.title', {
                defaultValue: 'Something went wrong',
              })}
            </h1>
          </div>
          <p className="text-sm text-muted-fg leading-relaxed">
            {t('errorBoundary.description', {
              defaultValue:
                'The page failed to load. Reload to try again, or reset locally-stored data if the problem persists.',
            })}
          </p>
          {this.state.error?.message && (
            <pre className="text-[11px] font-mono text-muted-fg bg-surface-2 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button variant="primary" onClick={this.reset}>
              <RefreshCw className="h-4 w-4" />
              {t('errorBoundary.retry', { defaultValue: 'Try again' })}
            </Button>
            <Button variant="ghost" onClick={this.resetLocalData} className="text-danger">
              <Trash2 className="h-4 w-4" />
              {t('errorBoundary.resetData', { defaultValue: 'Reset local data' })}
            </Button>
          </div>
        </Card>
      </div>
    );
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryBase);
