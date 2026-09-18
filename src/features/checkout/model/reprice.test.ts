import { describe, expect, it } from 'vitest';

import type { ProductHit } from '@/entities/product';

import type { SubmittedLineItem } from './contract';
import { repriceBasket } from './reprice';

const submitted = (
  objectID: string,
  quantity: number,
  price = 999,
): SubmittedLineItem => ({
  objectID,
  quantity,
  name: `snapshot-${objectID}`,
  price,
});

const record = (objectID: string, price?: number): ProductHit => ({
  objectID,
  name: `catalogue-${objectID}`,
  ...(price === undefined ? {} : { price }),
});

const catalogue = (...records: ProductHit[]) =>
  new Map(records.map((r) => [r.objectID, r]));

describe('repriceBasket', () => {
  it('prices each line from the catalogue, not the submitted snapshot', () => {
    const result = repriceBasket(
      [submitted('a', 2, 10), submitted('b', 1, 20)],
      catalogue(record('a', 100), record('b', 50)),
    );

    expect(result.total).toBe(250); // 100*2 + 50*1 — snapshot prices ignored
    expect(result.itemCount).toBe(3);
    expect(result.lineItems).toEqual([
      {
        objectID: 'a',
        name: 'catalogue-a',
        quantity: 2,
        unitPrice: 100,
        lineTotal: 200,
      },
      {
        objectID: 'b',
        name: 'catalogue-b',
        quantity: 1,
        unitPrice: 50,
        lineTotal: 50,
      },
    ]);
  });

  it('uses the catalogue name, not the snapshot name', () => {
    const result = repriceBasket(
      [submitted('a', 1)],
      catalogue(record('a', 5)),
    );
    expect(result.lineItems[0]?.name).toBe('catalogue-a');
  });

  it('skips a line whose record is missing from the catalogue', () => {
    const result = repriceBasket(
      [submitted('a', 1), submitted('gone', 3)],
      catalogue(record('a', 10)),
    );

    expect(result.lineItems).toHaveLength(1);
    expect(result.total).toBe(10);
    expect(result.itemCount).toBe(1);
  });

  it('skips a line whose catalogue record has no price', () => {
    const result = repriceBasket(
      [submitted('a', 1), submitted('noprice', 2)],
      catalogue(record('a', 10), record('noprice')),
    );

    expect(result.lineItems).toHaveLength(1);
    expect(result.total).toBe(10);
  });

  it('skips lines with a non-positive or non-integer quantity', () => {
    const result = repriceBasket(
      [
        submitted('a', 0),
        submitted('b', -1),
        submitted('c', 1.5),
        submitted('d', 2),
      ],
      catalogue(
        record('a', 10),
        record('b', 10),
        record('c', 10),
        record('d', 10),
      ),
    );

    expect(result.lineItems.map((l) => l.objectID)).toEqual(['d']);
    expect(result.total).toBe(20);
  });

  it('skips lines whose catalogue price is NaN, Infinity, or negative', () => {
    const result = repriceBasket(
      [
        submitted('nan', 1),
        submitted('inf', 1),
        submitted('neg', 1),
        submitted('ok', 2),
      ],
      catalogue(
        record('nan', Number.NaN),
        record('inf', Number.POSITIVE_INFINITY),
        record('neg', -10),
        record('ok', 5),
      ),
    );

    expect(result.lineItems.map((l) => l.objectID)).toEqual(['ok']);
    expect(result.total).toBe(10);
    expect(Number.isFinite(result.total)).toBe(true);
  });

  it('rounds money to whole cents, killing float artifacts', () => {
    const result = repriceBasket(
      [submitted('a', 3)],
      catalogue(record('a', 19.99)),
    );

    expect(result.lineItems[0]?.lineTotal).toBe(59.97); // not 59.970000000000006
    expect(result.total).toBe(59.97);
  });

  it('returns an empty, zeroed result for an empty basket', () => {
    const result = repriceBasket([], catalogue());
    expect(result).toEqual({ lineItems: [], total: 0, itemCount: 0 });
  });
});
