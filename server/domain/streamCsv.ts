export type ServerCsvParserState = {
  headers: string[] | null;
  fields: string[];
  field: string;
  quoted: boolean;
  quotePending: boolean;
  utf8Carry: string;
};

export const initialServerCsvParserState = (): ServerCsvParserState => ({ headers: null, fields: [], field: "", quoted: false, quotePending: false, utf8Carry: "" });

function completeUtf8Prefix(input: Buffer) {
  if (!input.length) return input.length;
  let trailing = 0;
  for (let index = input.length - 1; index >= 0 && trailing < 3 && (input[index]! & 0b1100_0000) === 0b1000_0000; index -= 1) trailing += 1;
  if (!trailing) {
    const lead = input[input.length - 1]!;
    const expected = (lead & 0b1111_1000) === 0b1111_0000 ? 4 : (lead & 0b1111_0000) === 0b1110_0000 ? 3 : (lead & 0b1110_0000) === 0b1100_0000 ? 2 : 1;
    return expected > 1 ? input.length - 1 : input.length;
  }
  const leadIndex = input.length - trailing - 1;
  if (leadIndex < 0) return 0;
  const lead = input[leadIndex]!;
  const expected = (lead & 0b1111_1000) === 0b1111_0000 ? 4 : (lead & 0b1111_0000) === 0b1110_0000 ? 3 : (lead & 0b1110_0000) === 0b1100_0000 ? 2 : 1;
  return expected > trailing + 1 ? leadIndex : input.length;
}

export function parseServerCsvChunk(previous: ServerCsvParserState | null | undefined, incoming: Buffer, final = false) {
  const state: ServerCsvParserState = previous ? { ...previous, headers: previous.headers ? [...previous.headers] : null, fields: [...previous.fields] } : initialServerCsvParserState();
  const input = Buffer.concat([state.utf8Carry ? Buffer.from(state.utf8Carry, "base64") : Buffer.alloc(0), incoming]);
  const end = final ? input.length : completeUtf8Prefix(input);
  const text = input.subarray(0, end).toString("utf8");
  state.utf8Carry = input.subarray(end).toString("base64");
  const rows: Array<Record<string, string>> = [];

  function completeRecord() {
    state.fields.push(state.field);
    state.field = "";
    if (!state.headers) {
      state.headers = state.fields.map((value, index) => (index === 0 ? value.replace(/^\uFEFF/, "") : value).trim());
      if (!state.headers.length || state.headers.every(value => !value)) throw new Error("The CSV header row is empty.");
    } else if (state.fields.some(value => value.length)) {
      rows.push(Object.fromEntries(state.headers.map((header, index) => [header, state.fields[index] ?? ""])));
    }
    state.fields = [];
  }

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!;
    if (state.quotePending) {
      if (character === '"') { state.field += '"'; state.quotePending = false; continue; }
      state.quoted = false;
      state.quotePending = false;
    }
    if (state.quoted) {
      if (character === '"') state.quotePending = true; else state.field += character;
      continue;
    }
    if (character === '"' && !state.field) { state.quoted = true; continue; }
    if (character === ",") { state.fields.push(state.field); state.field = ""; continue; }
    if (character === "\n") { completeRecord(); continue; }
    if (character !== "\r") state.field += character;
  }
  if (final) {
    if (state.utf8Carry) throw new Error("The CSV ended in an incomplete UTF-8 character.");
    if (state.quotePending) { state.quotePending = false; state.quoted = false; }
    if (state.quoted) throw new Error("The CSV contains an unfinished quoted field.");
    if (state.field.length || state.fields.length) completeRecord();
  }
  return { state, rows };
}
