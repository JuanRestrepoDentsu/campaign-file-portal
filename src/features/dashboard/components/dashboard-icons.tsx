type DashboardIconProps = {
  className?: string;
};

export function ClientsIcon({
  className = 'size-5',
}: DashboardIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M4 21V7l8-4 8 4v14" />
      <path d="M8 10h1M8 14h1M15 10h1M15 14h1" />
      <path d="M10 21v-4h4v4" />
    </svg>
  );
}

export function UsersIcon({
  className = 'size-5',
}: DashboardIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle cx="9" cy="8" r="4" />
      <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
      <path d="M16 4.5a4 4 0 0 1 0 7" />
      <path d="M17 15a6 6 0 0 1 4 5.7" />
    </svg>
  );
}

export function CampaignsIcon({
  className = 'size-5',
}: DashboardIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

export function UploadsIcon({
  className = 'size-5',
}: DashboardIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 14v5h14v-5" />
    </svg>
  );
}