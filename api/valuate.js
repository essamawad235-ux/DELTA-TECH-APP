// Server-side iPhone buy-price estimate. The rule table never leaves the server.
// Pilot bands come from env VALUATION_PILOT (JSON). If missing or invalid, the endpoint answers "disabled".
const { normModel, normStorage } = require('./_hawary');

const MODELS = new Set();
['11', '12', '13', '14', '15', '16', '17', '18'].forEach((n) => ['', ' plus', ' pro', ' pro max', ' mini'].forEach((s) => MODELS.add(n + s)));
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

// Pilot bands: JSON array in env VALUATION_PILOT, e.g. [{model,storage,tax,minBattery,maxBattery,low,high}].
function parseBands() {
  try {
    const r = JSON.parse(process.env.VALUATION_PILOT || '');
    if (!Array.isArray(r) || !r.length) return null;
    const ok = r.every((x) => typeof x.model === 'string' && Number.isFinite(x.storage) && ['exempt', 'taxed'].includes(x.tax) &&
      Number.isFinite(x.minBattery) && Number.isFinite(x.maxBattery) && Number.isFinite(x.low) && Number.isFinite(x.high) && x.low > 0 && x.high >= x.low);
    return ok ? r : null;
  } catch (e) {
    return null;
  }
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

  const bands = parseBands();
  if (!bands) return res.status(200).json({ status: 'disabled' });
  if (q.defect) return res.status(200).json({ status: 'inspection', reason: 'defect' });
  if (q.screen) return res.status(200).json({ status: 'inspection', reason: 'screen' });
  if (q.back) return res.status(200).json({ status: 'inspection', reason: 'back' });
  if (q.noBox) return res.status(200).json({ status: 'inspection', reason: 'box' });
  if (q.tax === 'unknown') return res.status(200).json({ status: 'inspection', reason: 'tax' });
  const hit = bands.find((x) => normModel(x.model) === q.model && x.storage === q.storage && x.tax === q.tax &&
    q.battery >= x.minBattery && q.battery <= x.maxBattery);
  if (!hit) return res.status(200).json({ status: 'inspection', reason: 'nomatch' });
  return res.status(200).json({ status: 'ok', low: hit.low, high: hit.high, pilot: true });
};

function safeJson(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}

// pilot bands v1 (iPhone 13 128GB only)
