"use client";
import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TransactionRow = {
  id: number;
  Begin46Date: string;
  DocNo: string;
  TransactionType: "Receive" | "Pay";
  ReFrom: string | null;
  PayTo: string | null;
  PayFrom: string | null;
  Lot: string;
  ProductName: string;
  ColorCode: string;
  ColorName: string;
  Shape: string;
  SUM: string | number;
  LotList_Sorted: string;
  synced_at: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const SAMPLE_DATA: TransactionRow[] = [
  {
    id: 1,
    Begin46Date: "2026-03-10T00:00:00.000Z",
    DocNo: "6640",
    TransactionType: "Receive",
    ReFrom: "P88",
    PayTo: null,
    PayFrom: null,
    Lot: "220503",
    ProductName: "SH612",
    ColorCode: "2056-1+2051",
    ColorName: "โซลิคโอ๊ค+ผ้าครีม",
    Shape: "แพค",
    SUM: "3.0000",
    LotList_Sorted: "220503012,220503013,220503019",
    synced_at: "2026-03-10T09:02:41.000Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip \r \n and trim whitespace — fixes "6640\r" etc. */
const clean = (v?: string | null) => (v ?? "").replace(/[\r\n]/g, "").trim();

function formatDate(raw: string) {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? clean(raw)
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatQty(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return "—";
  // Show as integer if no decimal part, otherwise up to 4dp
  return n % 1 === 0
    ? n.toLocaleString()
    : n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 });
}

/**
 * "220503012,220503013,220503019"
 * → ["220503012–220503013", "220503019"]
 */
function getLotRanges(lotList: string): string[] {
  const lots = clean(lotList).split(",").map((s) => s.trim()).filter(Boolean);
  if (!lots.length) return [];

  const parsed = lots.map((lot) => {
    const m = lot.match(/^(.*?)(\d+)$/);
    return m
      ? { original: lot, prefix: m[1], num: parseInt(m[2], 10) }
      : { original: lot, prefix: lot, num: NaN };
  });

  parsed.sort((a, b) =>
    a.prefix !== b.prefix ? a.prefix.localeCompare(b.prefix) : a.num - b.num
  );

  const ranges: string[] = [];
  let i = 0;
  while (i < parsed.length) {
    const start = parsed[i];
    if (isNaN(start.num)) { ranges.push(start.original); i++; continue; }
    let j = i + 1;
    while (
      j < parsed.length &&
      parsed[j].prefix === start.prefix &&
      !isNaN(parsed[j].num) &&
      parsed[j].num === parsed[j - 1].num + 1
    ) j++;
    const end = parsed[j - 1];
    ranges.push(j - i === 1 ? start.original : `${start.original}–${end.original}`);
    i = j;
  }
  return ranges;
}

// ─── Lot Pills ────────────────────────────────────────────────────────────────

function LotRangePills({ lotList, sum }: { lotList: string; sum: string | number }) {
  const [open, setOpen] = useState(false);
  const ranges = getLotRanges(lotList);
  if (!ranges.length) return <span className="text-gray-300">—</span>;

  return (
    <div className="min-w-[160px]">
      <div className="flex flex-wrap gap-1 mb-1">
        {ranges.map((r, i) => (
          <span
            key={i}
            className="inline-flex items-center bg-indigo-50 text-indigo-700 border border-indigo-100 rounded px-2 py-0.5 font-mono text-[10px] whitespace-nowrap"
          >
            {r}
          </span>
        ))}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="text-[10px] text-gray-400 hover:text-indigo-500 transition-colors leading-none"
      >
        {open ? "▲ hide" : `▼ all ${formatQty(sum)} lots`}
      </button>
      {open && (
        <div className="mt-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-[10px] text-gray-500 leading-relaxed break-all max-w-xs">
          {clean(lotList)}
        </div>
      )}
    </div>
  );
}

// ─── Filters ──────────────────────────────────────────────────────────────────

function Filters({
  typeFilter,
  setTypeFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  onApplyFilters,
  isLoading
}: {
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  onApplyFilters: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Type Filter */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transaction Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="Receive">Receive</option>
            <option value="Pay">Pay</option>
          </select>
        </div>

        {/* Date From */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Date To */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Apply Button */}
        <div>
          <button
            onClick={onApplyFilters}
            disabled={isLoading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Loading..." : "Apply Filters"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

function DataTable({
  data,
  isLoading
}: {
  data: TransactionRow[];
  isLoading: boolean;
}) {
  const cols = ["#", "Type", "Date", "Doc No", "From/To", "Lot", "Product", "Color Code", "Color Name", "Shape", "Sum", "Lot Ranges"];

  return (
    <section className="rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white tracking-widest uppercase">Transactions</h2>
          <p className="text-[11px] text-white/60 mt-0.5">Combined Receive & Pay data</p>
        </div>
        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
          {isLoading ? "..." : `${data.length} records`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-indigo-50/60 border-b border-gray-200">
              {cols.map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left font-semibold text-gray-500 tracking-wider whitespace-nowrap text-[10px] uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={cols.length} className="px-6 py-14 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Loading transactions...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="px-6 py-14 text-center text-gray-300 text-sm">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const fromTo = row.TransactionType === "Receive"
                  ? clean(row.ReFrom)
                  : clean(row.PayFrom || row.PayTo || "");

                return (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-100 hover:bg-slate-50 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                    }`}
                  >
                    {/* # */}
                    <td className="px-4 py-3 text-gray-300 font-mono text-[10px] whitespace-nowrap">
                      {row.id}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        row.TransactionType === "Receive"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-indigo-100 text-indigo-800"
                      }`}>
                        {row.TransactionType}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-600 rounded px-2 py-0.5 text-[10px] font-medium">
                        {formatDate(row.Begin46Date)}
                      </span>
                    </td>

                    {/* Doc No */}
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-800">
                      {clean(row.DocNo)}
                    </td>

                    {/* From/To */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 rounded px-2 py-0.5 text-[10px] font-semibold">
                        {fromTo}
                      </span>
                    </td>

                    {/* Lot */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-gray-700">
                      {clean(row.Lot)}
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3">
                      <span
                        className="block max-w-[150px] truncate text-gray-700 font-medium"
                        title={clean(row.ProductName)}
                      >
                        {clean(row.ProductName)}
                      </span>
                    </td>

                    {/* Color Code */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="bg-violet-50 text-violet-700 border border-violet-100 rounded px-2 py-0.5 font-mono text-[10px]">
                        {clean(row.ColorCode)}
                      </span>
                    </td>

                    {/* Color Name */}
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-[11px]">
                      {clean(row.ColorName)}
                    </td>

                    {/* Shape */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="bg-teal-50 text-teal-700 border border-teal-100 rounded px-2 py-0.5 text-[10px] font-medium">
                        {clean(row.Shape)}
                      </span>
                    </td>

                    {/* Sum */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="font-bold text-gray-900 tabular-nums">
                        {formatQty(row.SUM)}
                      </span>
                    </td>

                    {/* Lot Ranges */}
                    <td className="px-4 py-3">
                      <LotRangePills lotList={row.LotList_Sorted} sum={row.SUM} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [data, setData] = useState<TransactionRow[]>(SAMPLE_DATA);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filter states
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      params.append("limit", "100"); // Load more records for better UX

      const url = `${API_URL}/api/transactions/filtered?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error("Server error");

      const result = await response.json();
      setData(result.data?.length ? result.data : SAMPLE_DATA);
      setFetchError(null);
    } catch (e: any) {
      setFetchError(e.message);
      setData(SAMPLE_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyFilters = () => {
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600" />
          <div>
            <h1 className="text-sm font-bold text-gray-900 tracking-wide">Production Tracker</h1>
            <p className="text-[11px] text-gray-400">
              Combined transactions — filter by type and date
            </p>
          </div>
        </div>
        {fetchError && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1.5 rounded-full">
            ⚠ Sample data — {fetchError}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        <Filters
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          onApplyFilters={handleApplyFilters}
          isLoading={loading}
        />

        <DataTable data={data} isLoading={loading} />
      </main>
    </div>
  );
}