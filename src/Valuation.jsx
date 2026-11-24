import React, { useEffect, useState } from 'react';

const WA = '201111860871';
const MODELS = ['iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
  'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
  'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro',
  'iPhone 16 Pro Max', 'iPhone 17', 'iPhone 17 Pro', 'iPhone 17 Pro Max', 'iPhone Air'];
const STORAGES = [64, 128, 256, 512, 1024];

const box = { maxWidth: 720, margin: '24px auto', padding: 16, direction: 'rtl', fontFamily: 'inherit' };
const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, marginBottom: 16, color: '#0f172a' };
const input = { width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 16, boxSizing: 'border-box' };
const lbl = { display: 'block', fontSize: 14, fontWeight: 600, margin: '10px 0 4px' };
const btn = { display: 'inline-block', padding: '12px 18px', borderRadius: 10, background: '#16a34a', color: '#fff', fontWeight: 700,
  border: 0, fontSize: 16, textDecoration: 'none', cursor: 'pointer' };
const fmt = (n) => Number(n).toLocaleString('en-US');
const wa = (text) => 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);

function Check({ checked, onChange, children }) {
  return (
    <label style={{ display: 'block', margin: '8px 0', fontSize: 15 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {children}
    </label>
  );
}

function ValuationForm() {
  const [f, setF] = useState({ model: 'iPhone 13', storage: 128, tax: 'exempt', battery: 85, back: false, screen: false, noBox: false, defect: false });
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => { setF({ ...f, [k]: v }); setRes(null); };

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch('/api/valuate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: f.model, storage: f.storage, tax: f.tax, battery: f.battery, backReplaced: f.back,
          screenReplaced: f.screen, noBox: f.noBox, otherDefect: f.defect }),
      });
      setRes(await r.json());
    } catch (err) {
      setRes({ status: 'inspection' });
    }
    setBusy(false);
  };

  const spec = f.model + ' ' + f.storage + 'GB، ' + (f.tax === 'exempt' ? 'معفي من الضريبة' : 'عليه ضريبة') + '، بطارية ' + f.battery + '%' +
    (f.back ? '، ظهر متغيّر' : '') + (f.screen ? '، شاشة متغيّرة' : '') + (f.noBox ? '، بدون علبة' : '') + (f.defect ? '، فيه عيب' : '');
  const quote = res && res.status === 'ok' ? 'تقييم مبدئي ' + fmt(res.low) + ' إلى ' + fmt(res.high) + ' ج.م' : 'محتاج فحص للتقييم';
  const msg = 'عايز أبيع أو أبدّل جهازي:\n' + spec + '\n' + quote;

  return (
    <section style={card}>
      <h2 style={{ marginTop: 0 }}>اعرف سعر جهازك قبل ما تيجي</h2>
      <form onSubmit={send}>
        <label style={lbl}>الموديل</label>
        <select style={input} value={f.model} onChange={(e) => set('model', e.target.value)}>
          {MODELS.map((m) => <option key={m}>{m}</option>)}
        </select>
        <label style={lbl}>المساحة</label>
        <select style={input} value={f.storage} onChange={(e) => set('storage', Number(e.target.value))}>
          {STORAGES.map((s) => <option key={s} value={s}>{s >= 1024 ? '1TB' : s + 'GB'}</option>)}
        </select>
        <label style={lbl}>الضريبة</label>
        <select style={input} value={f.tax} onChange={(e) => set('tax', e.target.value)}>
          <option value="exempt">معفي من الضريبة</option>
          <option value="taxed">عليه ضريبة</option>
        </select>
        <label style={lbl}>نسبة البطارية (٥٠ إلى ١٠٠)</label>
        <input style={input} type="number" min="50" max="100" inputMode="numeric" value={f.battery}
          onChange={(e) => set('battery', Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
        <Check checked={f.back} onChange={(v) => set('back', v)}>الظهر متغيّر</Check>
        <Check checked={f.screen} onChange={(v) => set('screen', v)}>الشاشة متغيّرة</Check>
        <Check checked={f.noBox} onChange={(v) => set('noBox', v)}>من غير علبة</Check>
        <Check checked={f.defect} onChange={(v) => set('defect', v)}>فيه عيب تاني (كاميرا، بصمة الوش، شاحن...)</Check>
        <button style={btn} type="submit" disabled={busy}>{busy ? '...' : 'احسب التقييم'}</button>
      </form>

      {res && res.status === 'ok' && (
        <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', borderRadius: 10 }}>
          {res.demo && <div style={{ background: '#fef3c7', padding: 8, borderRadius: 8, marginBottom: 8, fontWeight: 700 }}>
            نسخة تجريبية: الأرقام دي مش عرض حقيقي.</div>}
          <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(res.low)} إلى {fmt(res.high)} ج.م</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>تقييم مبدئي، والسعر النهائي بعد الفحص في الفرع.</div>
        </div>
      )}
      {res && res.status === 'inspection' && (
        <div style={{ marginTop: 16, padding: 12, background: '#f1f5f9', borderRadius: 10 }}>
          مش هقدر أحدد سعر دقيق للجهاز ده من هنا. ابعتلنا التفاصيل وهنقيّمه بالفحص.
        </div>
      )}
      {res && res.status === 'disabled' && (
        <div style={{ marginTop: 16, padding: 12, background: '#f1f5f9', borderRadius: 10 }}>
          التقييم التلقائي غير متاح دلوقتي. ابعتلنا التفاصيل على واتساب.
        </div>
      )}
      {res && res.status === 'error' && (
        <div style={{ marginTop: 16, padding: 12, background: '#fee2e2', borderRadius: 10 }}>راجع البيانات وجرّب تاني.</div>
      )}
      {res && res.status !== 'error' && (
        <p style={{ marginTop: 14 }}>
          <a style={btn} href={wa(msg)} target="_blank" rel="noreferrer">بيع أو بدّل على واتساب</a>
        </p>
      )}
    </section>
  );
}

function NewCatalog() {
  const [d, setD] = useState(null);
  useEffect(() => {
    fetch('/api/catalog').then((r) => r.json()).then(setD).catch(() => setD({ status: 'unavailable', items: [] }));
  }, []);
  if (!d || d.status !== 'ok' || !d.items.length) return null;
  const items = d.items.filter((i) => i.available);
  return (
    <section style={card}>
      <h2 style={{ marginTop: 0 }}>آيفون جديد بالطلب</h2>
      <p style={{ background: '#fef3c7', padding: 8, borderRadius: 8, fontSize: 14 }}>
        الأجهزة دي مش موجودة في الفرع. بنجيبها بالطلب من المورد، والسعر والتوفر بيتأكدوا قبل التأكيد.
        {d.updated ? ' آخر تحديث للقائمة: ' + d.updated : ''}
      </p>
      {items.map((i, k) => {
        const t = i.name + ' ' + i.storage + (i.tax === 'exempt' ? ' معفي' : i.tax === 'taxed' ? ' عليه ضريبة' : '') + (i.esim ? ' e-SIM' : '') +
          (i.color ? ' ' + i.color : '');
        return (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: k ? '1px solid #e2e8f0' : 0 }}>
            <div>
              <div style={{ fontWeight: 700 }}>{i.name} <span dir="ltr">{i.storage}</span></div>
              <div style={{ fontSize: 13, color: '#475569' }}>
                {[i.tax === 'exempt' ? 'معفي' : i.tax === 'taxed' ? 'عليه ضريبة' : null, i.esim ? 'e-SIM' : null, i.color].concat(i.tags).filter(Boolean).join(' · ')}
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 800 }}>{fmt(i.price)} ج.م</div>
              <a href={wa('عايز أسأل عن ' + t + ' (بالطلب من المورد) بسعر ' + fmt(i.price) + ' ج.م')} target="_blank" rel="noreferrer"
                style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>اطلب على واتساب</a>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default function Valuation() {
  return (
    <div style={box}>
      <ValuationForm />
      <NewCatalog />
    </div>
  );
}
