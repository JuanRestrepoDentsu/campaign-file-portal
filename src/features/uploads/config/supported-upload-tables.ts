export const supportedUploadTables = [
  {
    table: 'mc_users',
    displayName: 'Usuarios',
    fileType: 'users',
  },
  {
    table: 'mc_tracings',
    displayName: 'Seguimiento',
    fileType: 'tracings',
  },
] as const;

export type SupportedUploadTable =
  (typeof supportedUploadTables)[number]['table'];

export function getSupportedUploadTable(
  tableName: string,
) {
  return supportedUploadTables.find(
    (item) => item.table === tableName,
  ) ?? null;
}

export function getUploadFileType(tableName: string): string | null {
  return getSupportedUploadTable(tableName)?.fileType ?? null;
}

export function getUploadTableDisplayName(
  tableName: string,
): string {
  return getSupportedUploadTable(tableName)?.displayName ?? tableName;
}
