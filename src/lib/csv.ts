// Minimal RFC-4180 CSV tokenizer. Handles double-quoted fields, escaped quotes
// (""), commas/newlines inside quotes, CRLF line endings, and a leading UTF-8
// BOM. Kept pure (no I/O) so it's easy to test. The delimiter is configurable
// so callers can sniff comma vs semicolon vs tab from the header first.
export function parseCsv(text: string, delimiter = ","): string[][] {
  // Strip a leading UTF-8 BOM so the first header cell doesn't carry "﻿".
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { pushField(); rows.push(row); row = []; };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // A doubled quote ("") inside a quoted field is a literal quote.
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      pushField();
    } else if (ch === "\n") {
      pushRow();
    } else if (ch === "\r") {
      // Swallow CR; the following LF (if any) triggers the row break so CRLF
      // and lone-CR line endings both collapse to a single row boundary.
      if (text[i + 1] === "\n") { pushRow(); i++; }
      else pushRow();
    } else {
      field += ch;
    }
  }

  // Flush the trailing field/row unless the file ended on a clean newline.
  if (field !== "" || row.length > 0) pushRow();

  return rows;
}

// Sniff the most likely delimiter from a header line by counting occurrences
// outside quotes. Falls back to comma when nothing else appears.
export function sniffDelimiter(headerLine: string): string {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestCount = 0;
  for (const d of candidates) {
    let count = 0;
    let inQuotes = false;
    for (let i = 0; i < headerLine.length; i++) {
      const ch = headerLine[i];
      if (ch === '"') {
        if (inQuotes && headerLine[i + 1] === '"') { i++; continue; }
        inQuotes = !inQuotes;
      } else if (ch === d && !inQuotes) {
        count++;
      }
    }
    if (count > bestCount) { bestCount = count; best = d; }
  }
  return best;
}
