/** Display-only 10-digit request ID: YYMMDD + 1-based sequence (4 digits). */
export function formatPermintaanRequestId(
  requestSequence: number,
  requestedAt?: string | Date
): string {
  const seq = Math.max(1, Math.floor(Number(requestSequence)) || 1);
  const date = requestedAt ? new Date(requestedAt) : new Date();

  if (Number.isNaN(date.getTime())) {
    return String(seq).padStart(10, "0");
  }

  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const seqPart = String(seq).padStart(4, "0");

  return `${yy}${mm}${dd}${seqPart}`;
}

export function permintaanRequestIdLabel(
  requestSequence: number,
  requestedAt?: string | Date
): string {
  return `Request Id: ${formatPermintaanRequestId(requestSequence, requestedAt)}`;
}
