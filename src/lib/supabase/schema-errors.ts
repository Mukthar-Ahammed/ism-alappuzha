// PostgREST / Postgres codes for a table, column or function that does not exist yet, or a
// table the server role was never granted (42501), which means a migration has not been
// fully applied to this project.
const missingSchemaCodes = new Set(["PGRST202", "PGRST205", "42P01", "42703", "42883", "42501"]);

export class MissingMigrationError extends Error {
  constructor(readonly sqlFile: string) {
    super("Database setup is incomplete.");
  }
}

export function isMissingSchema(error: { code?: string } | null | undefined): boolean {
  return Boolean(error?.code && missingSchemaCodes.has(error.code));
}

/** Lets a page render setup instructions instead of its error boundary. */
export async function orMissingMigration<T>(promise: Promise<T>): Promise<T | MissingMigrationError> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof MissingMigrationError) {
      return error;
    }

    throw error;
  }
}
