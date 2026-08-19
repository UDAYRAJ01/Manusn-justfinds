import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { COOKIE_NAME } from "@shared/const";
import { AlertCircle, CheckCircle2, FileSpreadsheet, LoaderCircle, Send, ShieldCheck, UploadCloud } from "lucide-react";
import React, { useState } from "react";
import * as XLSX from "xlsx";

type SpreadsheetCell = string | number | boolean | null;
type SpreadsheetRow = Record<string, SpreadsheetCell>;

const expectedColumns = [
  "Business Name", "Main Category", "Subcategory", "Business Type", "Description (About)", "Services", "Address", "City", "Locality", "State", "Country", "Latitude", "Longitude", "Phone", "Email", "Website", "Hours", "Rating", "Total Reviews", "FAQs",
];
const templateExample: Record<string, string> = {
  "Business Name": "Example Hospital — Replace Before Import",
  "Main Category": "Healthcare",
  Subcategory: "Hospitals",
  "Business Type": "General Hospital",
  "Description (About)": "Template example only. Replace all details with factual business information before importing.",
  Services: "Outpatient consultation; Emergency care; Diagnostic services",
  Address: "123 Example Road, Civil Lines",
  City: "Jaipur",
  Locality: "Civil Lines",
  State: "Rajasthan",
  Country: "India",
  Latitude: "26.9124",
  Longitude: "75.7873",
  Phone: "+91 141 555 0100",
  Email: "hello@examplewellness.in",
  Website: "https://examplewellness.in",
  Hours: "Mon-Fri 09:00-18:00; Sat 10:00-14:00; Sun Closed",
  Rating: "",
  "Total Reviews": "",
  FAQs: '[{"question":"Do you take appointments?","answer":"Yes, appointments are available."}]',
};
const HIGH_VOLUME_FILE_LIMIT = 500 * 1024 * 1024;
const HIGH_VOLUME_FILE_LIMIT_LABEL = "500 MB";
const HIGH_VOLUME_UPLOAD_CHUNK_BYTES = 5 * 1024 * 1024;
const HIGH_VOLUME_WORKBOOK_FILE_LIMIT = 25 * 1024 * 1024;

function downloadLargeCsvTemplate() {
  const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const example = expectedColumns.map(column => escapeCsv(templateExample[column] ?? "")).join(",");
  const blob = new Blob([`\uFEFF${expectedColumns.map(escapeCsv).join(",")}\n${example}\n`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "just-finds-import-template-with-example.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function normalizeRows(source: Record<string, unknown>[]): SpreadsheetRow[] {
  return source.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value === undefined ? null : typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null ? value : String(value)])));
}

function StatusPill({ valid }: { valid: boolean }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${valid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{valid ? "Ready" : "Needs correction"}</span>;
}

function previewSessionHeaders(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem("manus-cookie");
    const prefix = `${COOKIE_NAME}=`;
    const token = raw?.split(";").find(value => value.trim().startsWith(prefix))?.trim().slice(prefix.length);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export function BulkImportManager() {
  const utils = trpc.useUtils();
  const [filename, setFilename] = useState("");
  const [rows, setRows] = useState<SpreadsheetRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [highVolumeFile, setHighVolumeFile] = useState<File | null>(null);
  const [highVolumeError, setHighVolumeError] = useState<string | null>(null);
  const [highVolumeUploadProgress, setHighVolumeUploadProgress] = useState<{ uploadedParts: number; totalParts: number } | null>(null);
  const preview = trpc.workspace.bulkImportPreview.useMutation();
  const commit = trpc.workspace.commitBulkImport.useMutation({ onSuccess: () => { void utils.workspace.bulkImportHistory.invalidate(); } });
  const beginHighVolume = trpc.workspace.beginHighVolumeImport.useMutation();
  const queueHighVolume = trpc.workspace.queueHighVolumeValidation.useMutation({ onSuccess: () => { void utils.workspace.bulkImportHistory.invalidate(); } });
  const startHighVolume = trpc.workspace.startHighVolumeImport.useMutation({ onSuccess: () => { void utils.workspace.bulkImportHistory.invalidate(); } });
  const retryHighVolume = trpc.workspace.retryHighVolumeImport.useMutation({ onSuccess: () => { void utils.workspace.bulkImportHistory.invalidate(); } });
  const cancelHighVolume = trpc.workspace.cancelHighVolumeImport.useMutation({ onSuccess: () => { void utils.workspace.bulkImportHistory.invalidate(); } });
  const { data: history = [] } = trpc.workspace.bulkImportHistory.useQuery(undefined, { refetchInterval: 5_000 });
  const staged = preview.data;

  async function readSpreadsheet(file: File | undefined) {
    setParseError(null);
    setRows([]);
    preview.reset();
    commit.reset();
    if (!file) { setFilename(""); return; }
    setFilename(file.name);
    if (file.size > 8 * 1024 * 1024) { setParseError("Please select a file below 8 MB."); return; }
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error("The spreadsheet does not contain a readable sheet.");
      const parsed = normalizeRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: "", raw: false }));
      if (!parsed.length) throw new Error("No business rows were found below the header row.");
      if (parsed.length > 500) throw new Error("A single import may contain up to 500 rows. Split the file and upload it in batches.");
      setRows(parsed);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "This spreadsheet could not be read. Use CSV, XLS, or XLSX.");
    }
  }

  async function stageHighVolumeFile(file: File | undefined) {
    setHighVolumeError(null);
    setHighVolumeUploadProgress(null);
    setHighVolumeFile(file ?? null);
    if (!file) return;
    if (!/\.(csv|xls|xlsx)$/i.test(file.name)) { setHighVolumeError("Use a CSV, XLS, or XLSX file."); return; }
    if (file.size > HIGH_VOLUME_FILE_LIMIT) { setHighVolumeError(`Choose a file below ${HIGH_VOLUME_FILE_LIMIT_LABEL}.`); return; }
    if (/\.(xls|xlsx)$/i.test(file.name) && file.size > HIGH_VOLUME_WORKBOOK_FILE_LIMIT) {
      setHighVolumeError("This Excel workbook is over 25 MB. Save it as CSV UTF-8, then upload the CSV here. CSV is the reliable format for large imports.");
      return;
    }
    try {
      const stagedUpload = await beginHighVolume.mutateAsync({ filename: file.name, contentType: file.type || undefined, fileSize: file.size });
      const totalParts = Math.ceil(file.size / HIGH_VOLUME_UPLOAD_CHUNK_BYTES);
      let completed = false;
      for (let partNumber = 0; partNumber < totalParts; partNumber += 1) {
        const start = partNumber * HIGH_VOLUME_UPLOAD_CHUNK_BYTES;
        const uploaded = await fetch(`${stagedUpload.uploadPath}/parts/${partNumber}`, {
          method: "PUT",
          credentials: "include",
          headers: { ...previewSessionHeaders(), ...(file.type ? { "Content-Type": file.type } : {}) },
          body: file.slice(start, Math.min(start + HIGH_VOLUME_UPLOAD_CHUNK_BYTES, file.size), file.type),
        });
        const payload = await uploaded.json().catch(() => null) as { error?: string; complete?: boolean; uploadedParts?: number; totalParts?: number } | null;
        if (!uploaded.ok) throw new Error(payload?.error || `Secure upload stopped at chunk ${partNumber + 1} of ${totalParts}. Please try again.`);
        setHighVolumeUploadProgress({ uploadedParts: payload?.uploadedParts ?? partNumber + 1, totalParts: payload?.totalParts ?? totalParts });
        completed = Boolean(payload?.complete);
      }
      if (!completed) throw new Error("The spreadsheet upload did not finish securely. Please select the file again.");
      await queueHighVolume.mutateAsync({ importId: stagedUpload.importId });
      await utils.workspace.bulkImportHistory.invalidate();
      setHighVolumeFile(null);
    } catch (error) {
      setHighVolumeError(error instanceof Error ? error.message : "The large import could not be queued.");
    } finally {
      setHighVolumeUploadProgress(null);
    }
  }

  return <section className="mt-8 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
    <div className="space-y-5">
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1f51c8]"><FileSpreadsheet className="size-5" /></span><div><h2 className="font-semibold text-slate-900">Upload business spreadsheet</h2><p className="mt-1 text-xs leading-5 text-slate-500">CSV, XLS, and XLSX are read in this browser for preview. Valid rows become **submitted**, private listings—never public listings.</p></div></div>
        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-9 text-center transition hover:border-[#1f51c8] hover:bg-blue-50/40"><UploadCloud className="size-7 text-[#1f51c8]" /><span className="mt-3 text-sm font-semibold text-slate-700">{filename || "Choose a CSV or Excel file"}</span><span className="mt-1 text-xs text-slate-500">Maximum 500 rows and 8 MB per import</span><input className="sr-only" type="file" accept=".csv,.xlsx,.xls" onChange={event => void readSpreadsheet(event.target.files?.[0])} /></label>
        {parseError && <p className="mt-4 flex gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs leading-5 text-rose-700"><AlertCircle className="mt-0.5 size-4 shrink-0" />{parseError}</p>}
        {rows.length > 0 && <p className="mt-4 flex gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /><strong>{rows.length} rows</strong> are ready for validation. Review the server-side preview before creating anything.</p>}
        <Button disabled={!rows.length || preview.isPending} onClick={() => preview.mutate({ filename, rows })} className="mt-4 w-full rounded-xl">{preview.isPending ? <><LoaderCircle className="mr-2 size-4 animate-spin" />Validating spreadsheet…</> : <><Send className="mr-2 size-4" />Validate & preview import</>}</Button>
        {preview.error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-700">{preview.error.message}</p>}
      </div>
      <div className="rounded-[24px] border border-slate-200 bg-white p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 text-[#1f51c8]" /><div><h2 className="font-semibold text-slate-900">Import rules</h2><p className="mt-1 text-xs leading-5 text-slate-500">Main Category must match an active category. Subcategory and Business Type are validated against that category hierarchy. City must match an active Indian city in the platform catalogue; common city aliases are also recognised.</p></div></div><p className="mt-4 text-xs font-semibold uppercase tracking-[.12em] text-slate-500">Supported columns</p><div className="mt-3 flex flex-wrap gap-2">{expectedColumns.map(column => <span key={column} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">{column}</span>)}</div><p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">**Rating**, **Total Reviews**, and **FAQs** are never turned into customer reviews. Ratings and totals stay only in the private import audit; FAQs are held for administrator review.</p></div>
      <div className="rounded-[24px] border border-indigo-100 bg-indigo-50/30 p-6 shadow-sm">
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700"><UploadCloud className="size-5" /></span><div><h2 className="font-semibold text-slate-900">Large file import</h2><p className="mt-1 text-xs leading-5 text-slate-600">For up to <strong>100,000 listings</strong>. Use <strong>CSV UTF-8</strong> for files larger than 25 MB; CSV validation runs one secured source part at a time in the background without loading the whole file into the 512 MB worker. XLS/XLSX remain available up to 25 MB.</p><Button type="button" variant="outline" size="sm" className="mt-3 h-8 rounded-lg border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50" onClick={downloadLargeCsvTemplate}>Download CSV header template</Button></div></div>
        <p className="mt-4 rounded-xl bg-white/80 p-3 text-xs leading-5 text-slate-600"><strong>Excel steps:</strong> File → Save As → choose <strong>CSV UTF-8 (Comma delimited) (*.csv)</strong> → save → select that CSV below. The column headers must remain unchanged.</p>
        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-white/80 px-4 py-7 text-center transition hover:border-indigo-500"><FileSpreadsheet className="size-7 text-indigo-600" /><span className="mt-3 text-sm font-semibold text-slate-700">{highVolumeFile?.name || "Choose a large CSV file"}</span><span className="mt-1 text-xs text-slate-500">CSV: up to 100,000 rows / {HIGH_VOLUME_FILE_LIMIT_LABEL}; XLS/XLSX: up to 25 MB</span><input className="sr-only" type="file" accept=".csv,.xlsx,.xls" disabled={beginHighVolume.isPending || queueHighVolume.isPending || Boolean(highVolumeUploadProgress)} onChange={event => void stageHighVolumeFile(event.target.files?.[0])} /></label>
        {highVolumeUploadProgress && <p className="mt-3 flex items-center gap-2 text-xs text-indigo-700"><LoaderCircle className="size-4 animate-spin" />Securely uploading part {highVolumeUploadProgress.uploadedParts} of {highVolumeUploadProgress.totalParts}. Keep this page open until upload completes; validation then continues in the background.</p>}
        {(beginHighVolume.isPending || queueHighVolume.isPending) && <p className="mt-3 flex items-center gap-2 text-xs text-indigo-700"><LoaderCircle className="size-4 animate-spin" />Staging complete; placing the validation job in the background queue…</p>}
        {highVolumeError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-700">{highVolumeError}</p>}
      </div>
    </div>
    <div className="space-y-5">
      <div className="rounded-[24px] border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Validation preview</h2>
        {!staged ? <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">Upload a spreadsheet to see row-level category, city, location, duplicate, and field validation here.</p> : <><p className="mt-2 text-xs leading-5 text-slate-500">{staged.message}</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><Summary label="Rows" value={staged.summary.totalRows} /><Summary label="Ready" value={staged.summary.validRows} tone="green" /><Summary label="Corrections" value={staged.summary.invalidRows} tone="red" /><Summary label="Warnings" value={staged.summary.warningRows} tone="amber" /></div><div className="mt-5 max-h-[420px] space-y-2 overflow-auto pr-1">{staged.rows.map(row => <div key={row.rowNumber} className="rounded-xl border border-slate-100 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-800">#{row.rowNumber} · {row.businessName}</p><p className="mt-1 text-xs text-slate-500">{row.category}{row.subcategory ? ` · ${row.subcategory}` : ""} · {row.city}{row.locality ? ` · ${row.locality}` : ""}</p></div><StatusPill valid={row.valid} /></div>{row.errors.map(error => <p className="mt-2 text-xs leading-5 text-rose-700" key={error}>• {error}</p>)}{row.warnings.map(warning => <p className="mt-2 text-xs leading-5 text-amber-700" key={warning}>• {warning}</p>)}</div>)}</div><Button disabled={!staged.summary.validRows || commit.isPending || Boolean(commit.data?.alreadyCompleted)} onClick={() => commit.mutate({ importId: staged.importId })} className="mt-5 w-full rounded-xl">{commit.isPending ? <><LoaderCircle className="mr-2 size-4 animate-spin" />Creating listings & starting AI drafts…</> : commit.data?.alreadyCompleted ? "Import already completed" : <>Create {staged.summary.validRows} listings & start AI drafts</>}</Button>{commit.data && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">Created {commit.data.createdRows} submitted listing{commit.data.createdRows === 1 ? "" : "s"}; {commit.data.skippedRows} row{commit.data.skippedRows === 1 ? "" : "s"} skipped. Gemini drafting has started automatically; review drafts in Approvals before publishing.</p>}{commit.error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-700">{commit.error.message}</p>}</>}
      </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-6"><h2 className="font-semibold text-slate-900">Recent imports</h2><div className="mt-4 space-y-2">{history.length ? history.map(item => <div key={item.id} className="rounded-xl bg-slate-50 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-800">{item.filename}</p><p className="mt-1 text-xs text-slate-500">{item.validRows} ready/imported · {item.failedRows} invalid/skipped · {item.totalRows} total</p>{item.phase !== "staged" && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${item.progressPercent}%` }} /></div>}<p className="mt-1 text-[11px] text-slate-500 capitalize">{item.phase} · {item.progressPercent}% complete</p>{item.aiRewriteBatchId ? <p className="mt-2 rounded-lg bg-indigo-50 px-2.5 py-2 text-xs leading-5 text-indigo-800"><strong>Gemini AI drafting · {item.aiRewriteStatus ?? "queued"}</strong><br />{item.aiRewriteCompletedJobs ?? 0} completed · {item.aiRewriteFailedJobs ?? 0} needs attention · {item.aiRewriteTotalJobs ?? 0} total. Drafts remain private until administrator approval.</p> : item.phase === "completed" ? <p className="mt-2 text-xs leading-5 text-indigo-700">Imported listings are being prepared for automatic Gemini drafts.</p> : null}{item.errorMessage && <p className="mt-2 text-xs text-rose-700">{item.errorMessage}</p>}{!item.sourceUploadedAt && <p className="mt-2 text-xs leading-5 text-amber-800">This older import does not have a verified spreadsheet in secure storage, so it cannot be retried. Upload the spreadsheet again above; the new upload will queue automatically.</p>}</div><span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600">{item.status}</span></div>{item.phase === "staged" && item.sourceUploadedAt && <Button size="sm" className="mt-3 rounded-lg" disabled={queueHighVolume.isPending} onClick={() => queueHighVolume.mutate({ importId: item.id })}>{queueHighVolume.isPending ? "Starting validation…" : "Start background validation"}</Button>}{item.phase === "ready" && <Button size="sm" className="mt-3 rounded-lg" disabled={startHighVolume.isPending} onClick={() => startHighVolume.mutate({ importId: item.id })}>Create listings & start AI drafts</Button>}{item.status === "failed" && item.sourceUploadedAt && item.errorCategory !== "format_limit" && <Button size="sm" variant="outline" className="mt-3 rounded-lg" disabled={retryHighVolume.isPending} onClick={() => retryHighVolume.mutate({ importId: item.id })}>Retry background import</Button>}{["queued", "processing", "retrying"].includes(item.status) && <Button size="sm" variant="ghost" className="mt-3 rounded-lg text-rose-700" disabled={cancelHighVolume.isPending} onClick={() => cancelHighVolume.mutate({ importId: item.id })}>Cancel import</Button>}</div>) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No imports have been created yet.</p>}</div></div>
    </div>
  </section>;
}

function Summary({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "green" | "red" | "amber" }) { const toneClass = tone === "green" ? "bg-emerald-50 text-emerald-800" : tone === "red" ? "bg-rose-50 text-rose-800" : tone === "amber" ? "bg-amber-50 text-amber-800" : "bg-slate-50 text-slate-800"; return <div className={`rounded-xl p-3 ${toneClass}`}><p className="text-lg font-semibold">{value}</p><p className="mt-0.5 text-[11px] font-medium uppercase tracking-[.1em] opacity-75">{label}</p></div>; }
