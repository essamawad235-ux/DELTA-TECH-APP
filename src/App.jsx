import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Smartphone,
  Plus,
  Search,
  Trash2,
  Edit3,
  DollarSign,
  TrendingUp,
  Package,
  Shield,
  UserCheck,
  X,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';

// ==========================================
// 1. إعدادات Firebase وربط التطبيق
// ==========================================
// استبدل القيم التالية ببيانات مشروعك من Firebase Console -> Project Settings
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "YOUR_FIREBASE_APP_ID",
};

// تعريف appId الثابت لحل مشكلة ReferenceError وتحديد مسار البيانات في Firestore
const appId = "delta-tech-app";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// أكواد الدخول حسب الصلاحيات (تقدر تعدلها براحتك)
const ACCESS_CODES = {
  admin: "2026", // صلاحيات كاملة (رؤية التكلفة والأرباح + التعديل والحذف)
  staff: "1111", // صلاحيات موظف مبيعات (إضافة وعرض أسعار البيع فقط بدون تكلفة أو حذف)
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // نظام الصلاحيات (Role-Based Access Control)
  const [role, setRole] = useState(() => localStorage.getItem("dt_role") || "staff");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // بيانات الأجهزة والحسابات
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // نافذة إضافة / تعديل جهاز
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    deviceName: "",
    imei: "",
    storage: "",
    condition: "مستعمل كسر زيرو",
    buyPrice: "",
    sellPrice: "",
    status: "متاح",
    clientOrSupplier: "",
    notes: "",
  });

  // 1. تسجيل الدخول المجهول في Firebase
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error("Auth error:", err);
          setErrorMsg("فشل الاتصال بالمصادقة. تأكد من تفعيل Anonymous في Firebase Authentication.");
          setLoading(false);
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. جلب البيانات لحظياً من Firestore باستخدام appId
  useEffect(() => {
    if (!user) return;

    const devicesCollectionRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "devices"
    );

    const unsubscribeData = onSnapshot(
      devicesCollectionRef,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        // ترتيب الأحدث أولاً
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setDevices(list);
        setLoading(false);
        setErrorMsg("");
      },
      (err) => {
        console.error("Firestore error:", err);
        setErrorMsg("تعذر قراءة البيانات. تأكد من إعدادات Firestore Security Rules.");
        setLoading(false);
      }
    );

    return () => unsubscribeData();
  }, [user]);

  // حساب الإحصائيات المالية
  const stats = useMemo(() => {
    const totalDevices = devices.length;
    const availableCount = devices.filter((d) => d.status === "متاح").length;
    const soldDevices = devices.filter((d) => d.status === "مباع");
    const totalRevenue = soldDevices.reduce((sum, d) => sum + (Number(d.sellPrice) || 0), 0);
    const totalProfit = soldDevices.reduce(
      (sum, d) => sum + ((Number(d.sellPrice) || 0) - (Number(d.buyPrice) || 0)),
      0
    );
    const inventoryCost = devices
      .filter((d) => d.status === "متاح")
      .reduce((sum, d) => sum + (Number(d.buyPrice) || 0), 0);

    return { totalDevices, availableCount, totalRevenue, totalProfit, inventoryCost };
  }, [devices]);

  // تصفية القائمة حسب البحث والحالة
  const filteredDevices = useMemo(() => {
    return devices.filter((item) => {
      const matchesSearch =
        item.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientOrSupplier?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [devices, searchTerm, statusFilter]);

  // تبديل الصلاحيات
  const handleSwitchRole = (e) => {
    e.preventDefault();
    if (pinInput === ACCESS_CODES.admin) {
      setRole("admin");
      localStorage.setItem("dt_role", "admin");
      setShowRoleModal(false);
      setPinInput("");
      setPinError("");
    } else if (pinInput === ACCESS_CODES.staff) {
      setRole("staff");
      localStorage.setItem("dt_role", "staff");
      setShowRoleModal(false);
      setPinInput("");
      setPinError("");
    } else {
      setPinError("كود المرور غير صحيح");
    }
  };

  // فتح نموذج الإضافة أو التعديل
  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      deviceName: "",
      imei: "",
      storage: "",
      condition: "مستعمل كسر زيرو",
      buyPrice: "",
      sellPrice: "",
      status: "متاح",
      clientOrSupplier: "",
      notes: "",
    });
    setIsFormOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      deviceName: item.deviceName || "",
      imei: item.imei || "",
      storage: item.storage || "",
      condition: item.condition || "مستعمل كسر زيرو",
      buyPrice: item.buyPrice || "",
      sellPrice: item.sellPrice || "",
      status: item.status || "متاح",
      clientOrSupplier: item.clientOrSupplier || "",
      notes: item.notes || "",
    });
    setIsFormOpen(true);
  };

  // حفظ البيانات في Firestore
  const handleSaveDevice = async (e) => {
    e.preventDefault();
    if (!formData.deviceName.trim()) return;

    const payload = {
      ...formData,
      buyPrice: Number(formData.buyPrice) || 0,
      sellPrice: Number(formData.sellPrice) || 0,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingItem) {
        const docRef = doc(db, "artifacts", appId, "public", "data", "devices", editingItem.id);
        await updateDoc(docRef, payload);
      } else {
        const colRef = collection(db, "artifacts", appId, "public", "data", "devices");
        await addDoc(colRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error("Save error:", err);
      alert("حدث خطأ أثناء الحفظ. تأكد من صلاحيات Firestore.");
    }
  };

  // حذف سجل (للإدارة فقط)
  const handleDelete = async (id) => {
    if (role !== "admin") return;
    if (!window.confirm("هل أنت متأكد من حذف هذا الجهاز نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, "artifacts", appId, "public", "data", "devices", id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // شاشة التحميل
  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium text-slate-300">جاري تحميل بيانات DELTA TECHNOLOGY...</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* الهيدر */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-2.5 rounded-xl text-cyan-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide text-white">DELTA TECHNOLOGY</h1>
              <p className="text-xs text-slate-400">نظام إدارة وحسابات الأجهزة • مول دايموند</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRoleModal(true)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition ${
                role === "admin"
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {role === "admin" ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              <span>{role === "admin" ? "وضع الإدارة (كامل)" : "وضع المبيعات"}</span>
            </button>

            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-cyan-950/50 transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة جهاز</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* تنبيه الأخطاء إن وجد */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{errorMsg}</span>
          </div>
        )}

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-sm">الأجهزة المتاحة بالمخزن</span>
              <Package className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.availableCount} جهاز</p>
            <p className="text-xs text-slate-500 mt-1">من إجمالي {stats.totalDevices} مسجل</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-sm">إجمالي المبيعات</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {stats.totalRevenue.toLocaleString()} ج.م
            </p>
            <p className="text-xs text-slate-500 mt-1">للأجهزة المباعة</p>
          </div>

          {role === "admin" ? (
            <>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-sm">صافي الأرباح</span>
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-amber-400">
                  {stats.totalProfit.toLocaleString()} ج.م
                </p>
                <p className="text-xs text-slate-500 mt-1">خاص بالإدارة فقط</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-sm">رأس مال المخزن الحالي</span>
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-purple-400">
                  {stats.inventoryCost.toLocaleString()} ج.م
                </p>
                <p className="text-xs text-slate-500 mt-1">تكلفة الأجهزة المتاحة</p>
              </div>
            </>
          ) : (
            <div className="sm:col-span-2 bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-center text-slate-500 text-sm gap-2">
              <Lock className="w-4 h-4" />
              <span>بيانات التكلفة وصافي الأرباح مخفية في وضع المبيعات</span>
            </div>
          )}
        </div>

        {/* شريط البحث والفلترة */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث باسم الجهاز، السيريال IMEI، أو اسم العميل/المورد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-11 pl-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex gap-2">
            {["all", "متاح", "مباع", "صيانة"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
                  statusFilter === status
                    ? "bg-cyan-600 border-cyan-500 text-white"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {status === "all" ? "الكل" : status}
              </button>
            ))}
          </div>
        </div>

        {/* جدول الأجهزة */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-medium">الجهاز والمواصفات</th>
                  <th className="py-3.5 px-4 font-medium">IMEI / السيريال</th>
                  <th className="py-3.5 px-4 font-medium">الحالة</th>
                  {role === "admin" && <th className="py-3.5 px-4 font-medium">سعر الشراء</th>}
                  <th className="py-3.5 px-4 font-medium">سعر البيع</th>
                  {role === "admin" && <th className="py-3.5 px-4 font-medium">الربح</th>}
                  <th className="py-3.5 px-4 font-medium">العميل / المورد</th>
                  <th className="py-3.5 px-4 font-medium text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={role === "admin" ? 8 : 6} className="py-12 text-center text-slate-500">
                      لا توجد أجهزة مطابقة حالياً. اضغط على «إضافة جهاز» للبدء.
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((item) => {
                    const profit = (Number(item.sellPrice) || 0) - (Number(item.buyPrice) || 0);
                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{item.deviceName}</div>
                          <div className="text-xs text-slate-400">
                            {item.storage ? `${item.storage} • ` : ""}
                            {item.condition}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                          {item.imei || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              item.status === "متاح"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : item.status === "مباع"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {item.status === "مباع" && <CheckCircle2 className="w-3 h-3" />}
                            {item.status}
                          </span>
                        </td>
                        {role === "admin" && (
                          <td className="py-3.5 px-4 text-slate-300">
                            {Number(item.buyPrice || 0).toLocaleString()} ج.م
                          </td>
                        )}
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {Number(item.sellPrice || 0).toLocaleString()} ج.م
                        </td>
                        {role === "admin" && (
                          <td
                            className={`py-3.5 px-4 font-semibold ${
                              profit >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {profit.toLocaleString()} ج.م
                          </td>
                        )}
                        <td className="py-3.5 px-4 text-slate-300">
                          {item.clientOrSupplier || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              title="تعديل"
                              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {role === "admin" && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                title="حذف"
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* نافذة إضافة / تعديل جهاز */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">
                {editingItem ? "تعديل بيانات الجهاز" : "تسجيل جهاز جديد"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDevice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">اسم الموديل *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: iPhone 13 Pro Max"
                    value={formData.deviceName}
                    onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">المساحة / اللون</label>
                  <input
                    type="text"
                    placeholder="مثال: 256GB أزرق"
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">IMEI / السيريال</label>
                  <input
                    type="text"
                    placeholder="آخر 5 أرقام أو السيريال كامل"
                    value={formData.imei}
                    onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">حالة الجهاز</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="متاح">متاح</option>
                    <option value="مباع">مباع</option>
                    <option value="صيانة">صيانة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {role === "admin" && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">سعر الشراء (ج.م)</label>
                    <input
                      type="number"
                      value={formData.buyPrice}
                      onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                )}
                <div className={role === "admin" ? "" : "sm:col-span-2"}>
                  <label className="block text-xs text-slate-400 mb-1">سعر البيع (ج.م)</label>
                  <input
                    type="number"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">اسم العميل أو المورد</label>
                <input
                  type="text"
                  placeholder="اسم البائع أو المشتري"
                  value={formData.clientOrSupplier}
                  onChange={(e) => setFormData({ ...formData, clientOrSupplier: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">ملاحظات (بطارية / كرتونة / ضمان)</label>
                <input
                  type="text"
                  placeholder="مثال: بطارية 89% بالعلبة"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تغيير الصلاحيات */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">تغيير وضع الصلاحيات</h3>
              <button onClick={() => setShowRoleModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              أدخل كود الإدارة (2026) لإظهار التكلفة والأرباح، أو كود المبيعات (1111).
            </p>
            <form onSubmit={handleSwitchRole} className="space-y-3">
              <input
                type="password"
                placeholder="أدخل الكود..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-center text-lg tracking-widest text-white"
                autoFocus
              />
              {pinError && <p className="text-xs text-red-400 text-center">{pinError}</p>}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold"
              >
                تأكيد
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
