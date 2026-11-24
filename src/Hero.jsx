import React from 'react';
import HERO_IMG from './heroimg.js';

const WA = '201111860871';
const wa = (t) => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;

const SERVICES = [
  { t: 'بيع وشراء موبايلات', d: 'جديد ومستعمل، وبنشتري جهازك بعد الفحص.', q: 'عايز أستفسر عن موبايل' },
  { t: 'سكرينات وسكنز بالليزر', d: 'قص مخصوص على مقاس جهازك.', q: 'عايز سكرينة ليزر لجهازي' },
  { t: 'إكسسوارات', d: 'جرابات وشواحن وسماعات.', q: 'عايز أسأل عن إكسسوارات' },
  { t: 'صيانة موبايلات', d: 'فحص وإصلاح الأعطال.', q: 'عايز أسأل عن صيانة' },
];

export function Hero() {
  const go = (id) => () => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <section dir="rtl" className="max-w-7xl mx-auto px-4 pt-8 space-y-8">
      <style>{`
        @keyframes dtUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes dtFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .dt-up{animation:dtUp .6s ease both}
        .dt-up2{animation:dtUp .6s .12s ease both}
        .dt-up3{animation:dtUp .6s .24s ease both}
        .dt-float{animation:dtFloat 5s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.dt-up,.dt-up2,.dt-up3,.dt-float{animation:none}}
      `}</style>
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div className="space-y-4">
          <h1 className="dt-up text-3xl md:text-4xl font-extrabold text-white leading-snug">
            موبايلات جديدة ومستعملة <span className="text-cyan-400">بسعر واضح</span> وفحص قدامك
          </h1>
          <p className="dt-up2 text-slate-300">
            شوف الأجهزة المتاحة، أو قيّم جهازك مبدئياً، والسعر النهائي بعد الفحص في الفرع.
          </p>
          <div className="dt-up3 flex flex-wrap gap-3">
            <button type="button" onClick={go('new-iphone')} className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold">
              اشتري جهاز
            </button>
            <button type="button" onClick={go('valuation')} className="px-5 py-3 rounded-xl border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10 font-bold">
              بيع أو بدّل جهازك
            </button>
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-cyan-950/50 border border-cyan-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
          <img src={HERO_IMG} alt="iPhone 14 Pro Max" className="dt-float w-48 h-48 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-xl object-cover shrink-0" />
          <div className="space-y-1 min-w-0 w-full text-center sm:text-right">
            <div className="text-xs font-bold text-amber-300">لقطة الأسبوع</div>
            <div className="text-lg font-bold text-white">iPhone 14 Pro Max</div>
            <div className="text-xs text-slate-300">128GB، بطارية 82%، ضهر متغيّر، معفي من الضريبة، من غير علبة</div>
            <div className="text-2xl font-extrabold text-cyan-300">36,000 جنيه</div>
            <a href={wa('عايز أحجز iPhone 14 Pro Max بسعر 36,000')} target="_blank" rel="noreferrer" className="inline-block mt-1 px-4 py-2 whitespace-nowrap rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold">
              احجزه على واتساب
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;

export function Services() {
  return (
    <section dir="rtl" id="services" className="pt-4">
      <div>
        <h2 className="text-lg font-bold text-white mb-3">خدماتنا</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SERVICES.map((s) => (
            <a key={s.t} href={wa(s.q)} target="_blank" rel="noreferrer" className="block bg-slate-900 border border-slate-700 hover:border-cyan-400/60 rounded-xl p-3 transition-colors">
              <div className="font-bold text-white text-sm">{s.t}</div>
              <div className="text-xs text-slate-400 mt-1">{s.d}</div>
              <div className="text-xs text-emerald-400 mt-2">اسأل على واتساب</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
