/**
 * Sale operations, straight against D1 — the store's one database.
 *
 *   bun run sale --sale wq-001 --now 240 --until 2026-10-20
 *   bun run sale --sale wq-001,wq-004 --off 15 --until 36h
 *   bun run sale --end-sale wq-001          (or: --end-sale all)
 *   bun run sale --sales                    (what is live, scheduled, ended)
 *   bun run sale --ping                     (rebuild with no data change)
 *
 * --until / --from take "90m" / "36h" / "2d", a plain date (read as that
 * day's local end), or an ISO instant. When the window ends the regular
 * price is back — nothing to clean up. --dry-run prints the SQL only.
 */
import { parseArgs } from 'node:util';
import { dirname } from 'node:path';

const USAGE = [
  'usage:',
  '  bun run sale --sale <sku[,sku]> --now <price> [--until <when>] [--from <when>]',
  '  bun run sale --sale <sku[,sku]> --off <percent> [--until <when>]',
  '  bun run sale --end-sale <sku[,sku]|all>',
  '  bun run sale --sales',
  '  bun run sale --ping',
  '  add --dry-run to print the SQL without writing.',
].join('\n');

const D1 = 'wiqar-products';
const ROOT = dirname(import.meta.dir);

const fail = (message: string): never => {
  console.error(`sale failed: ${message}`);
  console.error(USAGE);
  process.exit(1);
};

/* ── the cloud ───────────────────────────────────────────── */

const runSql = async (sql: string): Promise<Record<string, unknown>[]> => {
  const child = Bun.spawn({
    cmd: [process.execPath, 'x', 'wrangler', 'd1', 'execute', D1, '--remote', '--json', '--command', sql],
    cwd: ROOT,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout as ReadableStream).text(),
    new Response(child.stderr as ReadableStream).text(),
    child.exited,
  ]);
  if (code !== 0) {
    const tail = `${stderr}\n${stdout}`
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(-3)
      .join(' — ');
    throw new Error(`wrangler exited ${code}: ${tail}`);
  }
  const parsed = JSON.parse(stdout.trim());
  return (Array.isArray(parsed) ? parsed : [parsed]).flatMap((entry) => entry?.results ?? []);
};

const pingHook = async (reason: string): Promise<void> => {
  const hook = process.env.DEPLOY_HOOK_URL;
  if (!hook) {
    console.log(`no DEPLOY_HOOK_URL set — rebuild not pinged (${reason})`);
    return;
  }
  const response = await fetch(hook, { method: 'POST' });
  console.log(`rebuild pinged (${reason}): ${response.status}`);
};

/* ── time ────────────────────────────────────────────────── */

/** "36h" / "2d" from now, a plain date as its local end, or an ISO instant. */
const readInstant = (value: string): string => {
  const relative = /^(\d+)([smhd])$/.exec(value.trim());
  if (relative) {
    const step = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[relative[2] as 's' | 'm' | 'h' | 'd'];
    return new Date(Date.now() + Number(relative[1]) * step).toISOString();
  }
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  const parsed = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 23, 59, 59, 999)
    : new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`"${value}" is not a date`);
  return parsed.toISOString();
};

/* ── modes ───────────────────────────────────────────────── */

let parsed;
try {
  parsed = parseArgs({
    args: process.argv.slice(2),
    options: {
      sale: { type: 'string' },
      'end-sale': { type: 'string' },
      sales: { type: 'boolean' },
      ping: { type: 'boolean' },
      now: { type: 'string' },
      off: { type: 'string' },
      until: { type: 'string' },
      from: { type: 'string' },
      'dry-run': { type: 'boolean' },
    },
    strict: true,
  });
} catch (error) {
  fail(String((error as Error).message));
}
const { values } = parsed;

if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
  fail('CLOUDFLARE_ACCOUNT_ID is not set — add it to the repo .env');
}

try {
  if (values.sales) {
    const rows = await runSql(
      'SELECT sku, price, sale_price, sale_starts_at, sale_ends_at FROM products WHERE sale_price IS NOT NULL ORDER BY sku'
    );
    if (rows.length === 0) console.log('nothing on sale');
    const now = Date.now();
    for (const row of rows) {
      const start = row.sale_starts_at ? Date.parse(String(row.sale_starts_at)) : null;
      const end = row.sale_ends_at ? Date.parse(String(row.sale_ends_at)) : null;
      const state =
        (start === null || now >= start) && (end === null || now <= end)
          ? 'ACTIVE'
          : start !== null && now < start
            ? 'scheduled'
            : 'ended';
      console.log(
        `${row.sku}: sale ${row.sale_price} (regular ${row.price})${start !== null ? ` from ${row.sale_starts_at}` : ''}${end !== null ? ` until ${row.sale_ends_at}` : ''} — ${state}`
      );
    }
    process.exit(0);
  }

  if (values.ping) {
    await pingHook('manual');
    process.exit(0);
  }

  const endMode = values['end-sale'] !== undefined;
  const target = (endMode ? values['end-sale'] : values.sale)?.trim() ?? '';
  if (!target) fail('pick a mode: --sale, --end-sale, --sales or --ping');
  if (!endMode && (values.now !== undefined) === (values.off !== undefined)) {
    fail('give exactly one of --now <price> or --off <percent>');
  }

  const known = (await runSql('SELECT sku, price FROM products')) as { sku: string; price: number }[];
  const picked =
    endMode && target === 'all'
      ? known
      : target.split(',').map((want) => {
          const row = known.find((entry) => String(entry.sku).toUpperCase() === want.trim().toUpperCase());
          if (!row) throw new Error(`no product with sku "${want.trim()}"`);
          return row;
        });
  if (picked.length === 0) fail('no products matched');

  const statements: string[] = [];
  if (endMode) {
    const clause = target === 'all' ? '1=1' : picked.map((row) => `UPPER(sku) = UPPER('${row.sku}')`).join(' OR ');
    statements.push(`UPDATE products SET sale_price = NULL, sale_starts_at = NULL, sale_ends_at = NULL WHERE ${clause}`);
  } else {
    const percent = values.off === undefined ? null : Number(values.off);
    if (percent !== null && (!Number.isInteger(percent) || percent < 1 || percent > 99)) {
      fail('--off must be a whole percent from 1 to 99');
    }
    const starts = values.from ? `'${readInstant(values.from)}'` : 'NULL';
    const ends = values.until ? `'${readInstant(values.until)}'` : 'NULL';
    for (const row of picked) {
      const value =
        values.now !== undefined ? Number(values.now) : Math.round((Number(row.price) * (100 - (percent ?? 0))) / 100);
      if (!(value > 0)) fail(`--now "${values.now}" is not a price`);
      if (!(value < Number(row.price))) {
        fail(`${row.sku}: sale price ${value} must be lower than the regular price ${row.price}`);
      }
      statements.push(
        `UPDATE products SET sale_price = ${value}, sale_starts_at = ${starts}, sale_ends_at = ${ends} WHERE UPPER(sku) = UPPER('${row.sku}')`
      );
    }
  }

  for (const statement of statements) console.log(statement);
  if (values['dry-run']) {
    console.log('dry run — nothing written');
    process.exit(0);
  }

  await runSql(statements.join(';\n'));
  console.log('applied');
  await pingHook(endMode ? 'sale ended' : 'sale set');
} catch (error) {
  fail(String((error as Error).message ?? error));
}
