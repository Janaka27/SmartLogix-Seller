export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "LKR",
  }).format(value);
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(value));
}

export function formatDateTime(value: string): string {
  return formatDate(value, { hour: "numeric", minute: "2-digit" });
}

export function formatWeight(kg: number): string {
  return `${kg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`;
}

export function formatDistance(km: number): string {
  return `${km.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function formatVolume(cm3: number): string {
  if (cm3 >= 1_000_000) {
    return `${(cm3 / 1_000_000).toFixed(2)} m³`;
  }
  return `${cm3.toLocaleString()} cm³`;
}

// "45 min" under an hour, "1h 20m" over — reads better than raw minutes for
// a flight ETA.
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
