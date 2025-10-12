const WRITE_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'ALTER',
  'DROP',
  'TRUNCATE',
  'CREATE',
  'REPLACE',
  'MERGE',
  'GRANT',
  'REVOKE'
];

export const isWriteQuery = (sql: string): boolean => {
  const normalized = sql.trim().toUpperCase();
  for (const kw of WRITE_KEYWORDS) {
    if (normalized.startsWith(kw + ' ') || normalized.startsWith(kw + '\n')) {
      return true;
    }
  }
  // Detect multi-statement where any statement is write
  const statements = normalized
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
  return statements.some(stmt =>
    WRITE_KEYWORDS.some(kw => stmt.startsWith(kw + ' '))
  );
};
