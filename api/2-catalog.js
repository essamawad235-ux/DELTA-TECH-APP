// New iPhones from the supplier list, +500 EGP, labelled as order-from-supplier.
const { load, ageDays } = require('./_hawary');
const MARKUP = 500;
const MAX_AGE_DAYS = 3;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  const data = await load();
  if (!data || ageDays(data.updated) > MAX_AGE_DAYS) {
    res.status(200).json({ status: 'unavailable', items: [] });
    return;
  }
  const items = data.units
    .filter((u) => u.condition === 'new' && /^iphone/i.test(u.rawName) && !/case|cover|silicone|charger/i.test(u.rawName))
    .filter((u) => u.price >= 5000 && u.storage)
    .map((u) => ({
      name: u.rawName.replace(/`/g, '').replace(/^iphone\s*/i, 'iPhone '),
      storage: u.storage >= 1024 ? u.storage / 1024 + 'TB' : u.storage + 'GB',
      tax: u.tax,
      esim: u.esim,
      color: u.color,
      tags: u.tags.filter((t) => !/^(جديد|معفي|عليه ضريبة)$/.test(t)),
      available: u.inStock,
      price: u.price + MARKUP,
    }));
  res.status(200).json({ status: 'ok', updated: data.updated ? data.updated.toISOString().slice(0, 10) : null, items });
};
