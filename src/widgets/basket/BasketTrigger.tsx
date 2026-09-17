'use client';

import { Badge, Button, Drawer } from '@heroui/react';
import Link from 'next/link';
import { useState } from 'react';

import {
  useBasketCount,
  useBasketHasHydrated,
  useHydrateBasket,
} from '@/entities/basket';

import { BasketContents } from './BasketContents';

// The header basket entry point: an icon button with a live count badge that
// opens the drawer quick-view. It also owns client hydration (`useHydrateBasket`)
// — it is mounted in the global header, so reading the persisted basket here
// covers every route. The badge and accessible name only reflect the count once
// hydrated, so the server HTML and first client render agree (no flash / no
// mismatch); the drawer is a controlled overlay so the badge can wrap the same
// trigger button.
export function BasketTrigger() {
  useHydrateBasket();
  const hasHydrated = useBasketHasHydrated();
  const count = useBasketCount();
  const [isOpen, setIsOpen] = useState(false);

  const showCount = hasHydrated && count > 0;
  const label = hasHydrated
    ? `Basket, ${count} ${count === 1 ? 'item' : 'items'}`
    : 'Basket';

  return (
    <>
      <Badge.Anchor>
        <Button
          variant='ghost'
          isIconOnly
          aria-label={label}
          onPress={() => setIsOpen(true)}
        >
          <BasketIcon />
        </Button>
        {showCount ? (
          <Badge color='danger' size='sm' aria-hidden='true'>
            {count}
          </Badge>
        ) : null}
      </Badge.Anchor>

      <Drawer.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
        <Drawer.Content placement='right'>
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>Your basket</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <BasketContents
                footer={
                  <Link
                    href='/basket'
                    onClick={() => setIsOpen(false)}
                    className='rounded-medium inline-flex w-full items-center justify-center bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
                  >
                    View basket
                  </Link>
                }
              />
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}

function BasketIcon() {
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.75}
      strokeLinecap='round'
      strokeLinejoin='round'
      className='h-5 w-5'
    >
      <path d='M3 6h18l-1.5 11a2 2 0 0 1-2 1.75H6.5a2 2 0 0 1-2-1.75L3 6Z' />
      <path d='M8 6a4 4 0 0 1 8 0' />
    </svg>
  );
}
