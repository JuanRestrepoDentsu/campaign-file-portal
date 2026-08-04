export type AuditData =
  Record<string, unknown>;

export type AuditLogInput = {
  actorUserId: number | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  previousData?: AuditData | null;
  newData?: AuditData | null;
  metadata?: AuditData | null;
};

export type AuditRequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
};
