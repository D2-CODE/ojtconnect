/**
 * Utility helpers for OJT Connect PH
 */

// ---------------------------------------------------------------------------
// ID Generation
// ---------------------------------------------------------------------------

/**
 * Generates a 16-digit numeric string ID.
 * Format: 13-digit epoch milliseconds + 2-digit random suffix + 1-digit overflow guard.
 * Result is always exactly 16 characters.
 */
export function generateId(): string {
  const ts = Date.now().toString(); // 13 digits
  const rand = Math.floor(Math.random() * 100).toString().padStart(2, "0"); // 2 digits
  // Pad/trim to ensure exactly 16 digits
  const raw = ts + rand;
  return raw.slice(0, 16).padEnd(16, "0");
}

// ---------------------------------------------------------------------------
// Date Formatting
// ---------------------------------------------------------------------------

/**
 * Formats a date as "March 16, 2026".
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formats a date as "Mar 16".
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// String Utilities
// ---------------------------------------------------------------------------

/**
 * Returns uppercase initials from a full name.
 * "Juan Dela Cruz" → "JD"  (first and last word only)
 * Single word names → first two letters, e.g. "Juan" → "JU"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Converts a string to a URL-safe slug.
 * "OJT Connect PH!" → "ojt-connect-ph"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD") // decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric (keep spaces & hyphens)
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/-+/g, "-") // collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}

/**
 * Generates a cryptographically random 32-character hex token.
 * Falls back to a Math.random-based approach in environments without crypto.
 */
export function generateClaimToken(): string {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Node.js fallback (server-side without Web Crypto)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { randomBytes } = require("crypto") as typeof import("crypto");
  return randomBytes(16).toString("hex");
}

/**
 * Masks an email address for privacy display.
 * "juan@gmail.com" → "ju**@gmail.com"
 * Very short local parts (1–2 chars) are fully masked: "j@x.com" → "j*@x.com"
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;

  let masked: string;
  if (local.length <= 2) {
    masked = local[0] + "*".repeat(local.length - 1 || 1);
  } else {
    masked = local.slice(0, 2) + "**";
  }
  return `${masked}@${domain}`;
}

/**
 * Truncates text to maxLength characters, appending "…" if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "…";
}

/**
 * Strips Facebook UI noise from scraped post text.
 * Pass stripLines from DB — fetched server-side before calling this.
 */
export function cleanPostText(text: string, stripLines: string[] = []): string {
  if (!text) return text;

  const FALLBACK_REGEX = [
    /^\d+\s*(likes?|comments?|shares?).*/i,
    /^\d+[hmd]\s*[·•].*/i,
    /^like\s*[·•]\s*reply.*/i,
    /^view (all )?\d+ (comments?|replies).*/i,
  ];

  const lines = text.split('\n');
  const cleaned = lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      // Strip leading unicode noise (…, ·, •, etc.) before matching
      const normalized = trimmed.replace(/^[\u2026·•…\s]+/u, '').trim().toLowerCase();
      if (stripLines.some((s) => normalized.startsWith(s.toLowerCase()) || normalized === s.toLowerCase())) return '';
      if (FALLBACK_REGEX.some((re) => re.test(trimmed))) return '';
      // Strip inline suffix: e.g. "...thank you Comment as Vinod"
      let result = trimmed;
      for (const s of stripLines) {
        const idx = result.toLowerCase().indexOf(s.toLowerCase());
        if (idx > 0) result = result.slice(0, idx).trim();
      }
      return result;
    })
    .filter(Boolean);

  return cleaned.join('\n').trim();
}
