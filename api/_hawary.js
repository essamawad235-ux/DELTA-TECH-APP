// Reads the supplier price page and turns it into plain unit objects.
// Nothing here is exposed to the browser as-is; callers choose what to return.
const SOURCE = 'https://hawarylist.com/';
const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const AR = { '٠': 0, '١': 1, '٢': 2, '٣': 3, '٤': 4, '٥': 5, '٦': 6, '٧': 7, '٨': 8, '٩': 9 };
const TTL_MS = 10 * 60 * 1000;
let cache = null;

function toNum(s) {
  return Number(String(s).replace(/[٠-٩]/g, (d) => AR[d]).replace(/[^\d]/g, ''));
}

function normModel(raw) {
  const s = String(raw).toLowerCase().replace(/[`'"]/g, '').replace(/iphone\s*/g, '').replace(/\s+/g, ' ').trim();
  if (s === 'air') return 'air';
  const m = s.match(/^(\d{1,2})\s*(plus|pro max|pro|mini)?$/);
  return m ? m[1] + (m[2] ? ' ' + m[2] : '') : null;
}

function normStorage(raw) {
  const m = String(raw).toUpperCase().replace(/\s/g, '').match(/^(\d+)(GB|G|TB|T)$/);
  if (!m) return null;
  return m[2].startsWith('T') ? Number(m[1]) * 1024 : Number(m[1]);
}

function parseUpdated(html, now) {
  const m = html.match(/آخر تحديث\s*([^<]+)</);
  if (!m) return null;
  const day = toNum(m[1].split(/\s+/)[0]);
  const mi = MONTHS.findIndex((x) => m[1].includes(x));
  if (!day || mi < 0) return null;
  let d = new Date(Date.UTC(now.getUTCFullYear(), mi, day, 12));
  if (d.getTime() - now.getTime() > 2 * 86400000) d = new Date(Date.UTC(now.getUTCFullYear() - 1, mi, day, 12));
  return d;
}

function parseUnits(html) {
  const units = [];
  const chunks = html.split('<article class="row').slice(1);
  for (const c of chunks) {
    const head = c.match(/^([^"]*)"\s+data-s="[^"]*"\s+data-c="(new|used)"\s+data-b="([^"]*)"\s+data-stock="(\d)"/);
    const name = c.match(/<div class="name"><span>([^<]*)<\/span>(?:<span class="cap num">([^<]*)<\/span>)?/);
    const price = c.match(/data-price="(\d+)"/);
    if (!head || !name || !price) continue;
    const tags = [...c.matchAll(/<span class="t [^"]*">([^<]*)<\/span>/g)].map((x) => x[1].trim());
    const color = (c.match(/aria-label="الألوان:\s*([^"]*)"/) || [])[1] || null;
    const text = tags.join(' | ');
    const bat = text.match(/بطارية\s*(\d+)%/);
    units.push({
      rawName: name[1].trim(),
      model: normModel(name[1]),
      storage: normStorage(name[2] || ''),
      condition: head[2],
      brand: head[3],
      inStock: head[4] === '1' && !/غير متوفر/.test(text),
      tax: /معفي/.test(text) ? 'exempt' : /عليه ضريبة/.test(text) ? 'taxed' : null,
      battery: bat ? Number(bat[1]) : null,
      esim: /e-?sim/i.test(text),
      tags,
      color,
      modified: /مغير|خلع|بقعه|بقعة|كسر|شاشة/.test(text.replace(/بطارية/g, '')),
      price: Number(price[1]),
    });
  }
  return units;
}

async function load() {
  const now = new Date();
  if (cache && now.getTime() - cache.at < TTL_MS) return cache.data;
  try {
    const r = await fetch(SOURCE, { headers: { 'user-agent': 'Mozilla/5.0 DeltaTech' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('bad status');
    const html = await r.text();
    const units = parseUnits(html);
    if (units.length < 20) throw new Error('layout changed');
    cache = { at: now.getTime(), data: { units, updated: parseUpdated(html, now) } };
    return cache.data;
  } catch (e) {
    if (cache && now.getTime() - cache.at < 6 * 3600 * 1000) return cache.data; // stale but recent
    return null;
  }
}

function ageDays(updated) {
  return updated ? (Date.now() - updated.getTime()) / 86400000 : Infinity;
}

module.exports = { load, ageDays, normModel, normStorage, parseUnits };
