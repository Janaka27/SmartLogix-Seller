export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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

export function formatVolume(cm3: number): string {
  if (cm3 >= 1_000_000) {
    return `${(cm3 / 1_000_000).toFixed(2)} m³`;
  }
  return `${cm3.toLocaleString()} cm³`;
}
