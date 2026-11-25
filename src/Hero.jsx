import React from 'react';
import HERO_IMG from './heroimg.js';

const WA = '201111860871';
const wa = (t) => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;

const SERVICES = [
  { i: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>', t: 'بيع وشراء موبايلات', d: 'جديد ومستعمل، وبنشتري جهازك بعد الفحص.', q: 'عايز أستفسر عن موبايل' },
  { i: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>', t: 'سكرينات وسكنز بالليزر', d: 'قص مخصوص على مقاس جهازك.', q: 'عايز سكرينة ليزر لجهازي' },
  { i: '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="2" y="14" width="5" height="7" rx="2"/><rect x="17" y="14" width="5" height="7" rx="2"/>', t: 'إكسسوارات', d: 'جرابات وشواحن وسماعات.', q: 'عايز أسأل عن إكسسوارات' },
  { i: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.6-.6-.6-2.6z"/>', t: 'صيانة موبايلات', d: 'فحص وإصلاح الأعطال.', q: 'عايز أسأل عن صيانة' },
];

const CHIPS = ['سعر واضح', 'فحص قدامك', 'تقييم مبدئي أونلاين'];

const STEPS = [
  { n: '1', t: 'اختار أو قيّم', d: 'شوف الأجهزة المتاحة، أو اعرف سعر جهازك مبدئياً.' },
  { n: '2', t: 'اتأكد على واتساب', d: 'نأكدلك التوفر والسعر قبل ما تيجي.' },
  { n: '3', t: 'افحص في الفرع', d: 'تفحص الجهاز قدامك، والسعر النهائي بعد الفحص.' },
];

export function Hero() {
  const go = (id) => () => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <section dir="rtl" className="relative border-b border-slate-800/70 bg-slate-950">
      <style>{`
        @keyframes dtUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes dtFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes dtGlow{0%,100%{opacity:.55}50%{opacity:.9}}
        .dt-up{animation:dtUp .7s ease both}
        .dt-up2{animation:dtUp .7s .12s ease both}
        .dt-up3{animation:dtUp .7s .24s ease both}
        .dt-up4{animation:dtUp .7s .36s ease both}
        .dt-float{animation:dtFloat 6s ease-in-out infinite}
        .dt-glow{animation:dtGlow 7s ease-in-out infinite}
        .dt-grad{background:linear-gradient(90deg,#22d3ee,#34d399);-webkit-background-clip:text;background-clip:text;color:transparent}
        .dt-grid{background-image:linear-gradient(rgba(148,163,184,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.06) 1px,transparent 1px);background-size:44px 44px;-webkit-mask-image:radial-gradient(ellipse at 50% 30%,#000 30%,transparent 75%);mask-image:radial-gradient(ellipse at 50% 30%,#000 30%,transparent 75%)}
        @media (prefers-reduced-motion:reduce){.dt-up,.dt-up2,.dt-up3,.dt-up4,.dt-float,.dt-glow{animation:none}}
      `}</style>
      <div className="relative max-w-7xl mx-auto px-4 pt-8 pb-4 md:pt-12 space-y-8">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <div className="dt-up inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> الحصري، 6 أكتوبر
            </div>
            <h1 className="dt-up text-3xl md:text-4xl font-bold text-white leading-snug">
              موبايلات جديدة ومستعملة <span className="text-cyan-300">بسعر واضح</span> وفحص قدامك
            </h1>
            <p className="dt-up2 text-slate-300 text-base md:text-lg leading-relaxed max-w-xl">
              شوف الأجهزة المتاحة، أو قيّم جهازك مبدئياً، والسعر النهائي بعد الفحص في الفرع.
            </p>
            <div className="dt-up3 flex flex-wrap gap-3">
              <button type="button" onClick={go('new-iphone')} className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition">
                اشتري جهاز
              </button>
              <button type="button" onClick={go('valuation')} className="px-6 py-3 rounded-xl border border-slate-600 text-slate-100 hover:bg-cyan-500/10 font-bold transition">
                بيع أو بدّل جهازك
              </button>
            </div>
            <div className="dt-up4 flex flex-wrap gap-2 pt-1">
              {CHIPS.map((c) => (
                <span key={c} className="text-xs text-slate-300 bg-slate-900/70 border border-slate-700/80 rounded-full px-3 py-1.5">✓ {c}</span>
              ))}
            </div>
          </div>

          <div className="dt-up2 relative">
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5">
              <img src={HERO_IMG} alt="iPhone 14 Pro Max" className="w-56 h-56 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-2xl object-cover shrink-0 ring-1 ring-white/10" />
              <div className="space-y-1.5 min-w-0 w-full text-center sm:text-right">
                <div className="inline-block text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-full px-2.5 py-0.5">لقطة الأسبوع</div>
                <div className="text-xl font-bold text-white">iPhone 14 Pro Max</div>
                <div className="text-xs text-slate-300 leading-relaxed">128GB، بطارية 82%، ضهر متغيّر، معفي من الضريبة، من غير علبة</div>
                <div className="text-3xl font-bold text-white">36,000 <span className="text-base font-bold text-cyan-200/80">جنيه</span></div>
                <a href={wa('عايز أحجز iPhone 14 Pro Max بسعر 36,000')} target="_blank" rel="noreferrer" className="inline-block mt-1 px-5 py-2.5 whitespace-nowrap rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition">
                  احجزه على واتساب
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {STEPS.map((s) => (
            <div key={s.n} className="flex items-start gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-extrabold flex items-center justify-center">{s.n}</div>
              <div>
                <div className="font-bold text-white text-sm">{s.t}</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;

export function Services() {
  return (
    <section dir="rtl" id="services" className="pt-6" style={{ scrollMarginTop: 120 }}>
      <div>
        <h2 className="text-xl font-bold text-white mb-1">خدماتنا</h2>
        <p className="text-sm text-slate-400 mb-4">اضغط على أي خدمة واسأل مباشرة على واتساب.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SERVICES.map((s) => (
            <a key={s.t} href={wa(s.q)} target="_blank" rel="noreferrer" className="group block bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-4 transition">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xl mb-3" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#67e8f9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: s.i }} /></div>
              <div className="font-bold text-white text-sm">{s.t}</div>
              <div className="text-xs text-slate-400 mt-1 leading-relaxed">{s.d}</div>
              <div className="text-xs text-emerald-400 mt-3 font-semibold group-hover:translate-x-[-2px] transition">اسأل على واتساب ←</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  const addr = 'مول دايموند، الدور الأول علوي، الحصري، 6 أكتوبر';
  const map = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Diamond Mall Hosary 6th of October');
  return (
    <footer dir="rtl" className="border-t border-slate-800 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8 grid gap-6 md:grid-cols-2 items-center">
        <div>
          <div className="text-lg font-extrabold text-white">DELTA TECHNOLOGY</div>
          <div className="text-sm text-slate-400 mt-1">{addr}</div>
          <a href={map} target="_blank" rel="noreferrer" className="inline-block mt-2 text-sm text-cyan-300 hover:text-cyan-200 font-semibold">افتح الموقع على الخريطة ←</a>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <a href="tel:01111860871" className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-sm" dir="ltr">01111860871</a>
          <a href="tel:01121410749" className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-sm" dir="ltr">01121410749</a>
          <a href={wa('مرحباً، عايز أستفسر')} target="_blank" rel="noreferrer" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl text-sm font-bold">كلمنا على واتساب</a>
        </div>
      </div>
    </footer>
  );
}
