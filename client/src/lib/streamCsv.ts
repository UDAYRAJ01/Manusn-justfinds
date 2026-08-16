export type CsvRow = Record<string, string>;

export async function streamCsvInBatches(file: File, onBatch: (rows: CsvRow[], bytesRead: number) => Promise<void>, batchSize = 500) {
  const reader = file.stream().getReader();
  const decoder = new TextDecoder("utf-8");
  let headers: string[] | null = null;
  let fields: string[] = [];
  let field = "";
  let quoted = false;
  let quotePending = false;
  let rows: CsvRow[] = [];
  let bytesRead = 0;

  async function flush() {
    if (!rows.length) return;
    const batch = rows;
    rows = [];
    await onBatch(batch, bytesRead);
  }

  async function completeRecord() {
    fields.push(field);
    field = "";
    if (!headers) {
      headers = fields.map((value, index) => (index === 0 ? value.replace(/^\uFEFF/, "") : value).trim());
      if (!headers.length || headers.every(value => !value)) throw new Error("The CSV header row is empty.");
    } else if (fields.some(value => value.length)) {
      const row = Object.fromEntries(headers.map((header, index) => [header, fields[index] ?? ""]));
      rows.push(row);
      if (rows.length >= batchSize) await flush();
    }
    fields = [];
  }

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    const text = decoder.decode(value, { stream: true });
    for (let index = 0; index < text.length; index += 1) {
      let character = text[index]!;
      if (quotePending) {
        if (character === '"') { field += '"'; quotePending = false; continue; }
        quoted = false;
        quotePending = false;
      }
      if (quoted) {
        if (character === '"') quotePending = true; else field += character;
        continue;
      }
      if (character === '"' && !field) { quoted = true; continue; }
      if (character === ",") { fields.push(field); field = ""; continue; }
      if (character === "\n") { await completeRecord(); continue; }
      if (character !== "\r") field += character;
    }
  }
  const tail = decoder.decode();
  if (tail) field += tail;
  if (quotePending) quoted = false;
  if (quoted) throw new Error("The CSV contains an unfinished quoted field.");
  if (field.length || fields.length) await completeRecord();
  await flush();
  if (!headers) throw new Error("The CSV does not contain a header row.");
}
