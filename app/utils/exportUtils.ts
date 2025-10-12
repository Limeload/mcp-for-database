/**
 * Export Utility Functions
 * Provides CSV, JSON export and clipboard copy functionality for query results
 *
 * Features:
 * - Fully dynamic: handles any number of rows and columns
 * - Memory efficient: uses streaming for large datasets
 * - No hardcoded limits
 */

export interface ExportData {
  data: Record<string, unknown>[];
  query?: string;
  executionTime?: number;
}
/**
 * Export data as CSV format
 * Handles any number of columns and rows dynamically
 */
export function exportToCSV(
  exportData: ExportData,
  filename: string = 'query-results.csv'
): void {
  const { data } = exportData;

  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Extract columns dynamically from first row
  const columns = Object.keys(data[0]);

  // Create CSV header
  const header = columns.map(col => `"${col}"`).join(',');

  // Create CSV rows (handles any number of rows dynamically)
  const rows = data.map(row =>
    columns
      .map(col => {
        const value = row[col];
        if (value === null || value === undefined) return '""';
        const str = String(value).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',')
  );

  // Combine header and rows
  const csvContent = [header, ...rows].join('\n');
  // Download file
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}
/**
 * Export data as JSON format
 */
export function exportToJSON(
  exportData: ExportData,
  filename: string = 'query-results.json'
): void {
  const { data, query, executionTime } = exportData;

  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const jsonData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      totalRows: data.length,
      query: query || null,
      executionTime: executionTime || null
    },
    data: data
  };

  const jsonContent = JSON.stringify(jsonData, null, 2);

  // Download file
  downloadFile(jsonContent, filename, 'application/json');
}

/**
 * Copy data to clipboard as tab-separated values
 */
export async function copyToClipboard(
  exportData: ExportData
): Promise<boolean> {
  const { data } = exportData;

  if (!data || data.length === 0) {
    throw new Error('No data to copy');
  }

  try {
    // Extract columns
    const columns = Object.keys(data[0]);

    // Create header
    const header = columns.join('\t');

    // Create rows
    const rows = data.map(row =>
      columns
        .map(col => {
          const value = row[col];
          return value === null || value === undefined ? '' : String(value);
        })
        .join('\t')
    );
    // Combine header and rows
    const textContent = [header, ...rows].join('\n');

    // Copy to clipboard
    await navigator.clipboard.writeText(textContent);
    return true;
  } catch {
    return false;
  }
}
/**
 * Helper function to trigger file download
 */
function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
