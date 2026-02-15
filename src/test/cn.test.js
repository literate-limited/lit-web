import { describe, expect, it } from 'vitest';
import { cn } from '../utils/cn';

describe('cn', () => {
  it('joins truthy classnames', () => {
    expect(cn('a', false, 'b', null, undefined, '', 'c')).toBe('a b c');
  });
});

