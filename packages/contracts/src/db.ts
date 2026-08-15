/**
 * Shared database contract. Lives in a package, not in an app.
 *
 * AMENDMENT v3 (F-017): the worker used to import Pool from
 * ../../api/src/kernel/unit-of-work, which is a cross-app reach into
 * another app's internals. Phase 4 Step 2 forbids exactly that.
 */
export interface Tx {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
}

export interface Pool {
  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
}
