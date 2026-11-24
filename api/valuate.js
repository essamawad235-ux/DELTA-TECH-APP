// Server-side iPhone buy-price estimate. The rule table never leaves the server.
// Rules come from env VALUATION_RULES (JSON). If it is missing, the endpoint answers "disabled".
const { load, ageDays, normModel, normStorage } = require('./_hawary');

const MODELS = new Set();
['11', '12', '13', '14', '15', '16', '17'].forEach((n) => ['', ' plus', ' pro', ' pro max', ' mini'].forEach((s) => MODELS.add(n + s)));
MODELS.add('air');
const STORAGES = new Set([64, 128, 256, 512, 1024]);
const hits = new Map();

function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 2000) hits.clear();
  return arr.length > 12;
}

function parseRules() {
  try {
    const r = JSON.parse(process.env.VALUATION_RULES || '');
    const ok = ['ratio', 'margin', 'batteryPct', 'backPct', 'noBoxPct', 'maxAgeDays', 'roundTo'].every((k) => Number.isFinite(r[k]));
    return ok ? r : null;
  } catch (e) {
    return null;
  }
}

function median(a) {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ status: 'error' });
  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  if (limited(ip)) return res.status(429).json({ status: 'error', message: 'rate' });

  const b = typeof req.body === 'string' ? safeJson(req.body) : req.body;
  if (!b || JSON.stringify(b).length > 1000) return res.status(400).json({ status: 'error' });
  const q = {
    model: normModel(b.model),
    storage: normStorage(String(b.storage).replace(/^(\d+)$/, '$1GB')),
    tax: b.tax,
    battery: Math.round(Number(b.battery)),
    back: b.backReplaced === true,
    screen: b.screenReplaced === true,
    noBox: b.noBox === true,
    defect: b.otherDefect === true,
  };
  if (!q.model || !MODELS.has(q.model) || !STORAGES.has(q.storage) || !['exempt', 'taxed', 'unknown'].includes(q.tax) ||
      !Number.isFinite(q.battery) || q.battery < 50 || q.battery > 100) {
    return res.status(400).json({ status: 'error', message: 'invalid' });
  }

  const rules = parseRules();
  if (!rules) return res.status(200).json({ status: 'disabled' });
  if (q.defect) return res.status(200).json({ status: 'inspection', reason: 'defect' });
  if (q.screen) return res.status(200).json({ status: 'inspection', reason: 'screen' });
  if (q.tax === 'unknown') return res.status(200).json({ status: 'inspection', reason: 'tax' });
  // Placeholder rules never produce numbers unless the page explicitly runs in marked demo mode.
  if (rules.demo === true && b.demo !== true) return res.status(200).json({ status: 'demo_off' });

  const data = await load();
  if (!data || ageDays(data.updated) > rules.maxAgeDays) return res.status(200).json({ status: 'inspection', reason: 'stale' });

  const rows = data.units.filter((u) => u.condition === 'used' && u.inStock && !u.modified && u.model === q.model &&
    u.storage === q.storage && u.tax === q.tax && u.battery);
  if (!rows.length) return res.status(200).json({ status: 'inspection', reason: 'nomatch' });
  const p = rows.map((r) => r.price);
  if (rows.length > 1 && (Math.max(...p) - Math.min(...p)) / Math.min(...p) > 0.25) {
    return res.status(200).json({ status: 'inspection', reason: 'spread' });
  }
  const refPrice = median(p);
  const refBattery = median(rows.map((r) => r.battery));
  let pct = 0;
  if (q.battery < refBattery) pct += (refBattery - q.battery) * rules.batteryPct; // only the gap vs the matched unit
  if (q.back) pct += rules.backPct;
  if (q.noBox) pct += rules.noBoxPct;
  const buy = refPrice * rules.ratio * (1 - pct / 100) - rules.margin;
  if (!(buy > 0)) return res.status(200).json({ status: 'inspection', reason: 'low' });
  const step = rules.roundTo;
  const mid = Math.floor(buy / step) * step;
  const out = { status: 'ok', low: Math.floor(mid * 0.95 / step) * step, high: mid, basis: rows.length };
  if (rules.demo === true) out.demo = true;
  return res.status(200).json(out);
};

function safeJson(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}
