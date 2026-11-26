import React from 'react';

const WA = '201111860871';
const fmt = (n) => Number(n).toLocaleString('en-US');
const wa = (text) => 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
const ITEMS = [
 {
  "name": "iPhone 17 Pro Max",
  "storage": "512GB",
  "battery": "94%",
  "tags": [
   "معفي",
   "شاشة مغيرة",
   "خبطة في الفريم"
  ],
  "price": 79000
 },
 {
  "name": "iPhone 16 Pro Max",
  "storage": "256GB",
  "battery": "88%",
  "tags": [
   "معفي"
  ],
  "price": 61000
 },
 {
  "name": "iPhone 16 Pro Max",
  "storage": "256GB",
  "battery": "94%",
  "tags": [
   "ضهر مغير"
  ],
  "price": 58900
 },
 {
  "name": "iPhone 16",
  "storage": "256GB",
  "battery": "87%",
  "tags": [
   "معفي",
   "بقعة في الشاشة"
  ],
  "price": 36800
 },
 {
  "name": "iPhone 15",
  "storage": "128GB",
  "battery": "83%",
  "tags": [],
  "price": 39300
 },
 {
  "name": "iPhone 14 Plus",
  "storage": "128GB",
  "battery": "76%",
  "tags": [],
  "price": 30800
 },
 {
  "name": "iPhone 13 Pro Max",
  "storage": "512GB",
  "battery": "76%",
  "tags": [],
  "price": 42900
 },
 {
  "name": "iPhone 13 Pro Max",
  "storage": "128GB",
  "battery": "81%",
  "tags": [
   "شاشة مغيرة"
  ],
  "price": 31800
 },
 {
  "name": "iPhone 13",
  "storage": "256GB",
  "battery": "78%",
  "tags": [
   "بدون علبة"
  ],
  "price": 28800
 },
 {
  "name": "iPhone 13",
  "storage": "256GB",
  "battery": "88%",
  "tags": [
   "الضريبة لسه مشتغلتش"
  ],
  "price": 23200
 },
 {
  "name": "iPhone 13",
  "storage": "256GB",
  "battery": "81%",
  "tags": [
   "الضريبة لسه مشتغلتش"
  ],
  "price": 22700
 },
 {
  "name": "iPhone 13",
  "storage": "128GB",
  "battery": "85%",
  "tags": [],
  "price": 29300
 },
 {
  "name": "iPhone 13",
  "storage": "128GB",
  "battery": "100%",
  "tags": [
   "بطارية وشاشة مغيرين"
  ],
  "price": 20200
 },
 {
  "name": "iPhone 12 Pro Max",
  "storage": "256GB",
  "battery": "77%",
  "tags": [],
  "price": 27800
 },
 {
  "name": "iPhone 11 Pro Max",
  "storage": "256GB",
  "battery": "72%",
  "tags": [
   "بدون علبة",
   "شاشة مغيرة",
   "Face ID فاصل"
  ],
  "price": 15100
 },
 {
  "name": "iPhone 11 Pro",
  "storage": "256GB",
  "battery": "68%",
  "tags": [],
  "price": 16700
 },
 {
  "name": "iPhone 11",
  "storage": "128GB",
  "battery": "72%",
  "tags": [],
  "price": 14100
 },
 {
  "name": "iPhone 11",
  "storage": "128GB",
  "battery": "",
  "tags": [
   "شاشة وبطارية مغيرين"
  ],
  "price": 11600
 },
 {
  "name": "iPhone X",
  "storage": "64GB",
  "battery": "66%",
  "tags": [
   "بدون علبة",
   "ضهر وشاشة مغيرين"
  ],
  "price": 6000
 },
 {
  "name": "Apple Watch Series 7 Nike",
  "storage": "",
  "battery": "86%",
  "tags": [
   "بدون علبة"
  ],
  "price": 9500
 },
 {
  "name": "Apple Watch Series 4",
  "storage": "",
  "battery": "78%",
  "tags": [
   "بدون علبة"
  ],
  "price": 6000
 },
 {
  "name": "Samsung Galaxy S25 Ultra",
  "storage": "512GB / 12RAM",
  "battery": "",
  "tags": [
   "بدون علبة"
  ],
  "price": 50900
 },
 {
  "name": "Samsung Galaxy A23",
  "storage": "128GB / 6RAM",
  "battery": "",
  "tags": [
   "بدون علبة"
  ],
  "price": 6000
 },
 {
  "name": "Redmi Note 10 5G",
  "storage": "128GB / 6RAM",
  "battery": "",
  "tags": [
   "بدون علبة",
   "شاشة مغيرة"
  ],
  "price": 6500
 },
 {
  "name": "Vivo V60 Lite 5G",
  "storage": "256GB / 12RAM",
  "battery": "",
  "tags": [
   "بدون علبة"
  ],
  "price": 10600
 },
 {
  "name": "Vivo Y05e",
  "storage": "64GB / 4RAM",
  "battery": "",
  "tags": [],
  "price": 7000
 }
];

export default function NeighborCatalog() {
  return (
    <section id="more-devices" style={{ scrollMarginTop: 150 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7">
      <h2 className="text-xl font-bold text-white mb-3">أجهزة من بيكا (Bika)</h2>
      <p className="bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-xl text-sm mb-2">
        أكّد التوفر والسعر على واتساب.
      </p>
      <div className="grid gap-x-8 md:grid-cols-2">
        {ITEMS.map((i, k) => {
          const t = i.name + (i.storage ? ' ' + i.storage : '');
          const sub = [i.battery ? 'بطارية ' + i.battery : null].concat(i.tags).filter(Boolean).join(' · ');
          return (
            <div key={k} className="flex items-center justify-between gap-3 py-3 border-t border-slate-800">
              <div className="min-w-0">
                <div className="font-bold text-white">{i.name} <span dir="ltr">{i.storage}</span></div>
                <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
              </div>
              <div className="text-left shrink-0">
                <div className="font-bold text-white text-lg">{fmt(i.price)} ج.م</div>
                <a href={wa('عايز أسأل عن ' + t + ' بسعر ' + fmt(i.price) + ' ج.م، وعايز أتأكد من التوفر')} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 font-semibold">اطلب على واتساب</a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
