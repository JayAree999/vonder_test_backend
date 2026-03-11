import { getMssqlPool } from "./mssql";
import mysqlPool from "./src/config/db";
import { PoolConnection } from "mysql2/promise";

// ─── Queries ──────────────────────────────────────────────────────────────────

const RECEIVE_QUERY = `
SELECT
    CAST(Begin46Date AS DATE) AS Begin46Date,
    DocNo,
    ReFrom,
    Lot,
    ProductName,
    ColorCode,
    ColorName,
    Shape,
    SUM(Qty) AS [SUM],
    STUFF((
        SELECT ',' + i.Lot20
        FROM [produce].[dbo].[StproReBegin46] i
        WHERE i.DocNo        = o.DocNo
          AND i.ReFrom       = o.ReFrom
          AND i.Lot          = o.Lot
          AND i.ProductName  = o.ProductName
          AND i.ColorCode    = o.ColorCode
          AND i.ColorName    = o.ColorName
          AND i.Shape        = o.Shape
          AND CAST(i.Begin46Date AS DATE) = CAST(o.Begin46Date AS DATE)
        ORDER BY
            TRY_CAST(
                CASE
                    WHEN ISNUMERIC(i.Lot20) = 1 THEN i.Lot20
                    WHEN PATINDEX('%[0-9]%', i.Lot20) > 0
                         THEN SUBSTRING(i.Lot20, PATINDEX('%[0-9]%', i.Lot20), 50)
                    ELSE '0'
                END AS BIGINT
            )
        FOR XML PATH(''), TYPE
    ).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS LotList_Sorted,
    COUNT(*) AS QtyRows
FROM [produce].[dbo].[StproReBegin46] o
WHERE CAST(Begin46Date AS DATE) BETWEEN '2026-01-17' AND '2026-03-11'  -- ✅ Replace TOP 100 with date range
GROUP BY
    CAST(Begin46Date AS DATE),
    DocNo, ReFrom, Lot,
    ProductName, ColorCode, ColorName, Shape
ORDER BY CAST(Begin46Date AS DATE) DESC;
`;

const PAY_QUERY = `
SELECT
    CAST(Begin46Date AS DATE) AS Begin46Date,
    DocNo,
    PayTo,
    PayFrom,
    Lot,
    ProductName,
    ColorCode,
    ColorName,
    Shape,
    SUM(Qty) AS [SUM],
    STUFF((
        SELECT ',' + i.Lot21
        FROM [produce].[dbo].[StproPayBegin46] i
        WHERE i.DocNo       = o.DocNo
          AND i.PayTo       = o.PayTo
          AND i.PayFrom     = o.PayFrom
          AND i.Lot         = o.Lot
          AND i.ProductName = o.ProductName
          AND i.ColorCode   = o.ColorCode
          AND i.ColorName   = o.ColorName
          AND i.Shape       = o.Shape
        ORDER BY
            TRY_CAST(
                CASE
                    WHEN ISNUMERIC(i.Lot21) = 1 THEN i.Lot21
                    WHEN PATINDEX('%[0-9]%', i.Lot21) > 0
                         THEN SUBSTRING(i.Lot21, PATINDEX('%[0-9]%', i.Lot21), 50)
                    ELSE '0'
                END AS BIGINT
            )
        FOR XML PATH(''), TYPE
    ).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS LotList_Sorted,
    COUNT(*) AS QtyRows
FROM [produce].[dbo].[StproPayBegin46] o 
WHERE CAST(Begin46Date AS DATE) BETWEEN '2026-01-17' AND '2026-03-11'  -- ✅ Replace TOP 100 with date range
GROUP BY
    Begin46Date,
    DocNo, PayTo, PayFrom, Lot,
    ProductName, ColorCode, ColorName, Shape
ORDER BY Begin46Date DESC;
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timestamp() {
  return new Date().toISOString();
}

function logStep(step: string, detail?: string) {
  const msg = detail ? `[sync][${step}] ${detail}` : `[sync][${step}]`;
  console.log(`${timestamp()} ${msg}`);
}

function logError(step: string, err: any) {
  console.error(`${timestamp()} [sync][${step}] ❌ ERROR: ${err?.message ?? err}`);
  if (err?.stack) console.error(err.stack);
}

// ─── MySQL Table Creation ─────────────────────────────────────────────────────

const CREATE_RECEIVE_TABLE = `
  CREATE TABLE IF NOT EXISTS StproReBegin46_cache (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    Begin46Date   DATETIME,
    DocNo         VARCHAR(50),
    ReFrom        VARCHAR(50),
    Lot           VARCHAR(50),
    ProductName   VARCHAR(100),
    ColorCode     VARCHAR(30),
    ColorName     VARCHAR(50),
    Shape         VARCHAR(50),
    TotalQty      DECIMAL(18,4),
    LotList_Sorted TEXT,
    QtyRows       INT,
    synced_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_docno (DocNo),
    INDEX idx_lot (Lot)
  )
`;

const CREATE_PAY_TABLE = `
  CREATE TABLE IF NOT EXISTS StproPayBegin46_cache (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    Begin46Date   DATETIME,
    DocNo         VARCHAR(50),
    PayTo         VARCHAR(50),
    PayFrom       VARCHAR(50),
    Lot           VARCHAR(50),
    ProductName   VARCHAR(100),
    ColorCode     VARCHAR(30),
    ColorName     VARCHAR(50),
    Shape         VARCHAR(50),
    TotalQty      DECIMAL(18,4),
    LotList_Sorted TEXT,
    QtyRows       INT,
    synced_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_docno (DocNo),
    INDEX idx_lot (Lot)
  )
`;

const CREATE_TRANSACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    TransactionType ENUM('receive', 'pay', 'edit') NOT NULL,
    Begin46Date DATETIME NOT NULL,
    DocNo VARCHAR(50) NOT NULL,
    Lot VARCHAR(50) NOT NULL,
    ProductName VARCHAR(100) NOT NULL,
    ColorCode VARCHAR(50) NOT NULL,
    ColorName VARCHAR(50) NOT NULL,
    Shape VARCHAR(50) NOT NULL,
    TotalQty DECIMAL(18,4) NOT NULL,
    LotList_Sorted TEXT,
    instock BOOLEAN NOT NULL DEFAULT 1,
    latestUpdateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ReFrom VARCHAR(50),
    PayTo VARCHAR(50),
    PayFrom VARCHAR(50),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (TransactionType),
    INDEX idx_Begin46Date (Begin46Date),
    INDEX idx_DocNo (DocNo),
    INDEX idx_Lot (Lot)
  )
`;

// ─── Table Bootstrap ──────────────────────────────────────────────────────────

async function ensureTables() {
  logStep("ensureTables", "Checking/creating MySQL tables…");
  const conn = await mysqlPool.getConnection();
  try {
    await Promise.all([
      conn.query(CREATE_RECEIVE_TABLE),
      conn.query(CREATE_PAY_TABLE),
      conn.query(CREATE_TRANSACTIONS_TABLE),
    ]);
    logStep("ensureTables", "✅ All tables ready");
  } finally {
    conn.release();
  }
}

// ─── Row Mappers ──────────────────────────────────────────────────────────────

function mapReceiveRow(r: any) {
  return [
    r.Begin46Date ? new Date(r.Begin46Date) : null,
    r.DocNo ?? null,
    r.ReFrom ?? null,
    r.Lot ?? null,
    r.ProductName ?? null,
    r.ColorCode ?? null,
    r.ColorName ?? null,
    r.Shape ?? null,
    r.TotalQty ?? 0,           // was [SUM] in query → renamed TotalQty
    r.LotList_Sorted ?? null,
    r.QtyRows ?? 0,
  ];
}

function mapPayRow(r: any) {
  return [
    r.Begin46Date ? new Date(r.Begin46Date) : null,
    r.DocNo ?? null,
    r.PayTo ?? null,
    r.PayFrom ?? null,
    r.Lot ?? null,
    r.ProductName ?? null,
    r.ColorCode ?? null,
    r.ColorName ?? null,
    r.Shape ?? null,
    r.TotalQty ?? 0,
    r.LotList_Sorted ?? null,
    r.QtyRows ?? 0,
  ];
}

function mapReceiveTransactionRow(r: any) {
  return [
    r.Begin46Date ? new Date(r.Begin46Date) : null,
    r.DocNo ?? null,
    "receive",
    r.ReFrom ?? null,       // ReFrom
    null,                   // PayTo
    null,                   // PayFrom
    r.Lot ?? null,
    r.ProductName ?? null,
    r.ColorCode ?? null,
    r.ColorName ?? null,
    r.Shape ?? null,
    r.TotalQty ?? 0,
    r.LotList_Sorted ?? null,
  ];
}

function mapPayTransactionRow(r: any) {
  return [
    r.Begin46Date ? new Date(r.Begin46Date) : null,
    r.DocNo ?? null,
    "pay",
    null,                   // ReFrom
    r.PayTo ?? null,
    r.PayFrom ?? null,
    r.Lot ?? null,
    r.ProductName ?? null,
    r.ColorCode ?? null,
    r.ColorName ?? null,
    r.Shape ?? null,
    r.TotalQty ?? 0,
    r.LotList_Sorted ?? null,
  ];
}

// ─── Insert Helpers ───────────────────────────────────────────────────────────

async function insertReceiveCache(conn: PoolConnection, rows: any[]) {
  if (rows.length === 0) return;
  await conn.query(
    `INSERT INTO StproReBegin46_cache
      (Begin46Date, DocNo, ReFrom, Lot, ProductName,
       ColorCode, ColorName, Shape, TotalQty, LotList_Sorted, QtyRows)
     VALUES ?`,
    [rows.map(mapReceiveRow)]
  );
}

async function insertPayCache(conn: PoolConnection, rows: any[]) {
  if (rows.length === 0) return;
  await conn.query(
    `INSERT INTO StproPayBegin46_cache
      (Begin46Date, DocNo, PayTo, PayFrom, Lot, ProductName,
       ColorCode, ColorName, Shape, TotalQty, LotList_Sorted, QtyRows)
     VALUES ?`,
    [rows.map(mapPayRow)]
  );
}

async function insertTransactions(conn: PoolConnection, receiveRows: any[], payRows: any[]) {
  const allValues = [
    ...receiveRows.map(mapReceiveTransactionRow),
    ...payRows.map(mapPayTransactionRow),
  ];
  if (allValues.length === 0) return;

  await conn.query(
    `INSERT INTO transactions
      (Begin46Date, DocNo, TransactionType, ReFrom, PayTo, PayFrom, Lot,
       ProductName, ColorCode, ColorName, Shape, TotalQty, LotList_Sorted)
     VALUES ?`,
    [allValues]
  );
}

// ─── Core Sync ────────────────────────────────────────────────────────────────

interface SyncOptions {
  receive: boolean;
  pay: boolean;
}

interface SyncResult {
  receive: number;
  pay: number;
  transactions: number;
  duration: number;
  error?: string;
}

async function runSyncCore(options: SyncOptions): Promise<SyncResult> {
  const start = Date.now();

  let receiveRows: any[] = [];
  let payRows: any[] = [];

  try {
    logStep("mssql", "Fetching data…");
    const t0 = Date.now();

    const [receiveResult, payResult] = await Promise.all([
      options.receive
        ? getMssqlPool().then(pool => pool.request().query(RECEIVE_QUERY))
        : Promise.resolve({ recordset: [] }),

      options.pay
        ? getMssqlPool().then(pool => pool.request().query(PAY_QUERY))
        : Promise.resolve({ recordset: [] }),
    ]);

    receiveRows = receiveResult.recordset ?? [];
    payRows    = payResult.recordset    ?? [];

    logStep(
      "mssql",
      `Fetched ${receiveRows.length} receive + ${payRows.length} pay rows in ${Date.now() - t0}ms`
    );

    const conn = await mysqlPool.getConnection();
    await conn.beginTransaction();

    try {
      logStep("mysql", "Clearing old data (keeping edit records)…");

      // Clear cache tables completely
      await Promise.all([
        conn.query("TRUNCATE TABLE StproReBegin46_cache"),
        conn.query("TRUNCATE TABLE StproPayBegin46_cache"),
      ]);

      // Clear transactions but preserve 'edit' rows
      const deleteResult = await conn.query(`
        DELETE FROM transactions 
        WHERE TransactionType != 'edit'
      `);

      const deletedCount = (deleteResult as any).affectedRows || 0;
      logStep("mysql", `Deleted ${deletedCount} non-edit transaction rows — edit rows preserved`);

      logStep("mysql", "Inserting fresh data…");
      const t1 = Date.now();

      await Promise.all([
        insertReceiveCache(conn, receiveRows),
        insertPayCache(conn, payRows),
        insertTransactions(conn, receiveRows, payRows),
      ]);

      logStep("mysql", `Inserts completed in ${Date.now() - t1}ms`);

      await conn.commit();
      logStep("mysql", "Transaction committed");

      const duration = Date.now() - start;
      const txCount = receiveRows.length + payRows.length;

      logStep(
        "runSync",
        `Sync completed in ${duration}ms — receive: ${receiveRows.length}, pay: ${payRows.length}, new transactions: ${txCount}`
      );

      return {
        receive: receiveRows.length,
        pay: payRows.length,
        transactions: txCount,
        duration,
      };
    } catch (innerErr) {
      await conn.rollback();
      throw innerErr;
    } finally {
      conn.release();
    }
  } catch (err: any) {
    const duration = Date.now() - start;
    logError("runSync", err);
    return {
      receive: 0,
      pay: 0,
      transactions: 0,
      duration,
      error: err.message || String(err),
    };
  }
}

// ─── Public Exports ───────────────────────────────────────────────────────────

export async function runSync(): Promise<SyncResult> {
  logStep("runSync", "Starting full sync");
  return runSyncCore({ receive: true, pay: true });
}

export async function runSyncReceive(): Promise<Pick<SyncResult, "receive" | "duration" | "error">> {
  logStep("runSyncReceive", "Starting Receive sync");
  const { receive, duration, error } = await runSyncCore({ receive: true, pay: false });
  return { receive, duration, error };
}

export async function runSyncPay(): Promise<Pick<SyncResult, "pay" | "duration" | "error">> {
  logStep("runSyncPay", "Starting Pay sync");
  const { pay, duration, error } = await runSyncCore({ receive: false, pay: true });
  return { pay, duration, error };
}