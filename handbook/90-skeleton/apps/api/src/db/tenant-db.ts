/**
 * REMOVED IN AMENDMENT v3 - see finding F-016.
 *
 * This file was a second, divergent implementation of withTenant() and
 * therefore a direct violation of golden rule #1, "a single path".
 * Two implementations means one of them eventually misses a guard, and
 * that is the one that leaks.
 *
 * Use apps/api/src/kernel/unit-of-work.ts. Nothing else.
 */
export * from '../kernel/unit-of-work';
