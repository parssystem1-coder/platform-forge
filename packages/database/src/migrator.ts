import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Pool } from '@platform/contracts';

export interface MigrationFile {
  name: string;
  fullPath: string;
  sql: string;
  checksum: string;
}

export interface AppliedMigration {
  id: number;
  name: string;
  checksum: string;
  executed_at: Date;
  duration_ms: number;
}

export interface MigratorOptions {
  ddlDir: string;
  migrations: string[];
}

export class DatabaseMigrator {
  constructor(
    private readonly pool: Pool,
    private readonly options: MigratorOptions,
  ) {}

  async ensureMigrationTable(): Promise<void> {
    await this.pool.transaction(async (tx) => {
      await tx.query(`
        CREATE TABLE IF NOT EXISTS _schema_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          checksum VARCHAR(64) NOT NULL,
          executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          duration_ms INTEGER NOT NULL
        );
      `);
    });
  }

  async getAppliedMigrations(): Promise<AppliedMigration[]> {
    await this.ensureMigrationTable();
    return this.pool.transaction(async (tx) => {
      return tx.query<AppliedMigration>(
        'SELECT id, name, checksum, executed_at, duration_ms FROM _schema_migrations ORDER BY id ASC;',
      );
    });
  }

  loadMigrationFiles(): MigrationFile[] {
    return this.options.migrations.map((relPath) => {
      const fullPath = path.resolve(this.options.ddlDir, relPath);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Migration file not found: ${fullPath}`);
      }
      const sql = fs.readFileSync(fullPath, 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      return {
        name: relPath,
        fullPath,
        sql,
        checksum,
      };
    });
  }

  async migrate(): Promise<{ applied: string[]; skipped: string[] }> {
    await this.ensureMigrationTable();
    const appliedList = await this.getAppliedMigrations();
    const appliedMap = new Map(appliedList.map((m) => [m.name, m]));

    const files = this.loadMigrationFiles();
    const applied: string[] = [];
    const skipped: string[] = [];

    for (const file of files) {
      const existing = appliedMap.get(file.name);
      if (existing) {
        if (existing.checksum !== file.checksum) {
          console.warn(
            `Warning: Migration ${file.name} checksum changed since execution (DB: ${existing.checksum}, File: ${file.checksum})`,
          );
        }
        skipped.push(file.name);
        continue;
      }

      const startTime = Date.now();
      await this.pool.transaction(async (tx) => {
        await tx.query(file.sql);
        const duration = Date.now() - startTime;
        await tx.query(
          'INSERT INTO _schema_migrations (name, checksum, duration_ms) VALUES ($1, $2, $3)',
          [file.name, file.checksum, duration],
        );
      });

      applied.push(file.name);
    }

    return { applied, skipped };
  }
}
