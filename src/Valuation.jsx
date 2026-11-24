import React, { useEffect, useState } from 'react';

const WA = '201111860871';
const MODELS = ['iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
  'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
  'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro',
  'iPhone 16 Pro Max', 'iPhone 17', 'iPhone 17 Pro', 'iPhone 17 Pro Max', 'iPhone Air'];
const STORAGES = [64, 128, 256, 512, 1024];

const DEMO_UI = typeof window !== 'undefined' && /[?&]demo=1/.test(window.location.search);
const card = 'bg-gradient-to-b from-slate-900 to-slate-900/60 border border-cyan-500/20 rounded-2xl p-5 sm:p-6 scroll-mt-28 shadow-lg shadow-black/20';
const input = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-base text-white focus:outline-none focus:border-cyan-500';
const lbl = 'block text-xs text-slate-400 mt-4 mb-1.5';
const btn = 'inline-block bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-semibold transition';
const fmt = (n) => Number(n).toLocaleString('en-US');
const wa = (text) => 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
const note = 'bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-xl text-sm';

function Check({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-3 my-3 text-sm text-slate-200">
      <input type="checkbox" className="w-5 h-5 accent-cyan-500" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {children}
    </label>
  );
}

function ValuationForm() {
  const [f, setF] = useState({ model: 'iPhone 13', storage: 128, tax: 'exempt', battery: 85, back: false, screen: false, noBox: false, defect: false, notes: '' });
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
          screenReplaced: f.screen, noBox: f.noBox, otherDefect: f.defect, demo: DEMO_UI }),
      });
      setRes(await r.json());
    } catch (err) {
      setRes({ status: 'inspection' });
    }
    setBusy(false);
  };

  const spec = f.model + ' ' + f.storage + 'GB، ' + (f.tax === 'exempt' ? 'معفي من الضريبة' : f.tax === 'taxed' ? 'عليه ضريبة' : 'الضريبة مش معروفة') + '، بطارية ' + f.battery + '%' +
    (f.back ? '، ظهر متغيّر' : '') + (f.screen ? '، شاشة متغيّرة' : '') + (f.noBox ? '، بدون علبة' : '') + (f.defect ? '، فيه عيب' : '');
  const quote = res && res.status === 'ok' ? 'تقييم مبدئي ' + fmt(res.low) + ' إلى ' + fmt(res.high) + ' ج.م' : 'محتاج فحص للتقييم';
  const notesClean = String(f.notes || '').replace(/\s+/g, ' ').trim().slice(0, 500);
  const msg = 'عايز أبيع أو أبدّل جهازي:\n' + spec + (notesClean ? '\nملاحظات: ' + notesClean : '') + '\n' + quote;

  return (
    <section id="valuation" style={{ scrollMarginTop: 150 }} className={card}>
      <h2 className="text-xl font-bold text-white mb-1">اعرف سعر جهازك قبل ما تيجي</h2>
      <p className="text-sm text-slate-400 mb-1">تقييم مبدئي لآيفون 13 (128 جيجا) بحالة سليمة وبالعلبة. باقي الأجهزة والحالات بتتقيّم بعد الفحص. السعر النهائي بعد الفحص في الفرع.</p>
      {DEMO_UI && <div className={note + ' mb-2 font-bold'}>نسخة تجريبية: أي رقم هنا مش عرض حقيقي ومش معتمد.</div>}
      <form onSubmit={send}>
        <label className={lbl}>الموديل</label>
        <select className={input} value={f.model} onChange={(e) => set('model', e.target.value)}>
          {MODELS.map((m) => <option key={m}>{m}</option>)}
        </select>
        <label className={lbl}>المساحة</label>
        <select className={input} value={f.storage} onChange={(e) => set('storage', Number(e.target.value))}>
          {STORAGES.map((s) => <option key={s} value={s}>{s >= 1024 ? '1TB' : s + 'GB'}</option>)}
        </select>
        <label className={lbl}>الضريبة</label>
        <select className={input} value={f.tax} onChange={(e) => set('tax', e.target.value)}>
          <option value="exempt">معفي من الضريبة</option>
          <option value="taxed">عليه ضريبة</option>
          <option value="unknown">مش عارف</option>
        </select>
        <label className={lbl}>نسبة البطارية (٥٠ إلى ١٠٠)</label>
        <input className={input} type="number" min="50" max="100" inputMode="numeric" value={f.battery}
          onChange={(e) => set('battery', Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
        <Check checked={f.back} onChange={(v) => set('back', v)}>الظهر متغيّر</Check>
        <Check checked={f.screen} onChange={(v) => set('screen', v)}>الشاشة متغيّرة</Check>
        <Check checked={f.noBox} onChange={(v) => set('noBox', v)}>من غير علبة</Check>
        <Check checked={f.defect} onChange={(v) => set('defect', v)}>فيه عيب تاني (كاميرا، بصمة الوش، شاحن...)</Check>
        <label className={lbl}>ملاحظات عن الجهاز (اختياري)</label>
        <textarea className={input} rows={3} maxLength={500} value={f.notes} placeholder="مثلاً: حالته، أي عيوب أو إصلاحات، الإكسسوارات، والسعر اللي ناوي عليه" onChange={(e) => set('notes', e.target.value)} />
        <div className="text-xs text-slate-500 mt-1">{String(f.notes || '').length} / 500</div>
        <button className={btn + ' mt-4'} type="submit" disabled={busy}>{busy ? '...' : 'جهّز التفاصيل'}</button>
      </form>

      {res && res.status === 'ok' && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          {res.demo && <div className={note + ' mb-3 font-bold'}>
            نسخة تجريبية: الأرقام دي مش عرض حقيقي.</div>}
          <div className="text-2xl font-extrabold text-cyan-400">{fmt(res.low)} إلى {fmt(res.high)} ج.م</div>
          <div className="text-sm text-slate-400 mt-1">تقييم مبدئي، والسعر النهائي بعد الفحص في الفرع.</div>
        </div>
      )}
      {res && res.status === 'inspection' && (
        <div className="mt-4 p-4 rounded-xl bg-slate-800 text-slate-200 text-sm">
          مش هقدر أحدد سعر دقيق للجهاز ده من هنا. ابعتلنا التفاصيل وهنقيّمه بالفحص.
        </div>
      )}
      {res && res.status === 'demo_off' && (
        <div className="mt-4 p-4 rounded-xl bg-slate-800 text-slate-200 text-sm">
          التسعير التلقائي مش شغّال لسه. ابعتلنا التفاصيل على واتساب وهنقيّم جهازك بعد الفحص.
        </div>
      )}
      {res && res.status === 'disabled' && (
        <div className="mt-4 p-4 rounded-xl bg-slate-800 text-slate-200 text-sm">
          التسعير التلقائي مش شغّال دلوقتي. ابعتلنا تفاصيل الجهاز على واتساب وهنقيّمه بعد الفحص.
        </div>
      )}
      {res && res.status === 'error' && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">راجع البيانات وجرّب تاني.</div>
      )}
      {res && res.status !== 'error' && (
        <p className="mt-4">
          <a className={btn} href={wa(msg)} target="_blank" rel="noreferrer">بيع أو بدّل على واتساب</a>
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
  const items = [...d.items].sort((a, b) => Number(b.available) - Number(a.available));
  return (
    <section id="new-iphone" style={{ scrollMarginTop: 150 }} className={card}>
      <h2 className="text-xl font-bold text-white mb-3">آيفون جديد بالطلب</h2>
      <p className={note + ' mb-2'}>
        الأجهزة دي مش موجودة في الفرع. بنجيبها بالطلب من المورد، والسعر والتوفر بيتأكدوا قبل التأكيد.
        {d.updated ? <>{' آخر تحديث للقائمة: '}<span dir="ltr" style={{ whiteSpace: 'nowrap' }}>{d.updated}</span></> : null}
      </p>
      {items.map((i, k) => {
        const taxT = i.tax === 'exempt' ? 'معفي' : i.tax === 'taxed' ? 'عليه ضريبة' : null;
        const t = i.name + ' ' + i.storage + (taxT ? ' ' + taxT : '') + (i.esim ? ' e-SIM' : '') + (i.color ? ' ' + i.color : '');
        return (
          <div key={k} className={'flex items-center justify-between gap-3 py-3 ' + (k ? 'border-t border-slate-800 ' : '') + (i.available ? '' : 'opacity-50')}>
            <div className="min-w-0">
              <div className="font-bold text-white">{i.name} <span dir="ltr">{i.storage}</span></div>
              <div className="text-xs text-slate-400 mt-0.5">{[taxT, i.esim ? 'e-SIM' : null, i.color].concat(i.tags).filter(Boolean).filter((x, j, a) => a.indexOf(x) === j).join(' · ')}</div>
            </div>
            <div className="text-left shrink-0">
              <div className="font-bold text-cyan-400">{fmt(i.price)} ج.م</div>
              {i.available ? (
                <a href={wa('عايز أسأل عن ' + t + ' (بالطلب من المورد) بسعر ' + fmt(i.price) + ' ج.م')} target="_blank" rel="noreferrer"
                  className="text-xs text-emerald-400 font-semibold">اطلب على واتساب</a>
              ) : <span className="text-xs text-slate-500">غير متاح حاليا</span>}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default function Valuation() {
  return (
    <div dir="rtl" className="bg-slate-950 text-slate-100 font-sans pb-12">
      <div className="max-w-7xl mx-auto px-4 pt-2 grid gap-4 lg:grid-cols-2 items-start">
        <ValuationForm />
        <NewCatalog />
      </div>
    </div>
  );
}
