'use client';

import { Button } from '@heroui/react';
import { Component, type ReactNode } from 'react';

// Defence-in-depth around the search subtree (issue #3). Query failures are
// handled inline via `useInstantSearch().status === "error"`; this boundary
// catches the *unexpected* case — a render-time exception in a widget or hit
// component — so a crash degrades to a retryable message instead of blanking
// the page. A class component is required: this is the one place React error
// boundaries can't be a hook.
type Props = { children: ReactNode };
type State = { hasError: boolean };

export class SearchErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[plp] search subtree crashed', error);
  }

  private reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role='alert'
        className='rounded-xl border border-border bg-surface p-6 text-surface-foreground'
      >
        <h2 className='text-base font-semibold text-foreground'>
          Something went wrong with search
        </h2>
        <p className='mt-1 text-sm text-muted'>
          The product list failed to render. You can try again.
        </p>
        <Button className='mt-4' variant='primary' onPress={this.reset}>
          Try again
        </Button>
      </div>
    );
  }
}
