import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

// ==========================================
// 1. إعدادات Firebase الحقيقية لمشروعك
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDMTlRJIU7n9FS4RwJ8anvXnHG2CEjSMBE",
  authDomain: "delta-technoloogy.firebaseapp.com",
  projectId: "delta-technoloogy",
  storageBucket: "delta-technoloogy.firebasestorage.app",
  messagingSenderId: "884629212277",
  appId: "1:884629212277:web:ab56e6c828804666947c3c",
  measurementId: "G-YBZGK84RPS"
};

const appId = "delta-tech-app";
const ADMIN_EMAIL = "admin@delta.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// أيقونات SVG مدمجة
const IconPhone = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="6" y="2" width="12" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const IconPlus = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconUpload = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconDownload = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconSearch = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconEdit = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconTrash = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconShield = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconLock = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconLogout = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconClose = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  // بيانات تسجيل الدخول
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // بيانات الأجهزة
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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setDevices([]);
      return;
    }

    setDataLoading(true);
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
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setDevices(list);
        setDataLoading(false);
        setErrorMsg("");
      },
      (err) => {
        console.error("Firestore error:", err);
        setErrorMsg("تعذر قراءة البيانات. تأكد من نشر Firestore Rules.");
        setDataLoading(false);
      }
    );

    return () => unsubscribeData();
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error("Login failed:", err);
      setLoginError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // استيراد البيانات من ملف CSV
  const handleCSVImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
      if (lines.length < 2) {
        alert("الملف فارغ أو لا يحتوي على صفوف بيانات.");
        setImporting(false);
        return;
      }

      const batch = writeBatch(db);
      const colRef = collection(db, "artifacts", appId, "public", "data", "devices");
      let count = 0;

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
        if (!cols[0]) continue;

        const newDocRef = doc(colRef);
        batch.set(newDocRef, {
          deviceName: cols[0] || "جهاز غير محدد",
          storage: cols[1] || "",
          imei: cols[2] || "",
          buyPrice: isAdmin ? Number(cols[3]) || 0 : 0,
          sellPrice: Number(cols[4]) || 0,
          status: cols[5] && ["متاح", "مباع", "صيانة"].includes(cols[5]) ? cols[5] : "متاح",
          clientOrSupplier: cols[6] || "",
          notes: cols[7] || "",
          condition: "مستعمل كسر زيرو",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        count++;
      }

      await batch.commit();
      alert(`تم استيراد ${count} جهاز بنجاح!`);
    } catch (err) {
      console.error("CSV Import error:", err);
      alert("حدث خطأ أثناء قراءة الملف. تأكد إنه محفوظ بصيغة CSV UTF-8.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // تصدير البيانات إلى ملف CSV كنسخة احتياطية
  const handleCSVExport = () => {
    if (devices.length === 0) {
      alert("لا توجد بيانات لتصديرها حالياً.");
      return;
    }

    const headers = isAdmin
      ? ["اسم الجهاز", "المساحة / اللون", "IMEI", "سعر الشراء", "سعر البيع", "الربح", "الحالة", "العميل / المورد", "ملاحظات"]
      : ["اسم الجهاز", "المساحة / اللون", "IMEI", "سعر البيع", "الحالة", "العميل / المورد", "ملاحظات"];

    const escapeCSV = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;

    const rows = devices.map((item) => {
      const buy = Number(item.buyPrice) || 0;
      const sell = Number(item.sellPrice) || 0;
      const profit = sell - buy;

      if (isAdmin) {
        return [
          escapeCSV(item.deviceName),
          escapeCSV(item.storage),
          escapeCSV(item.imei),
          buy,
          sell,
          profit,
          escapeCSV(item.status),
          escapeCSV(item.clientOrSupplier),
          escapeCSV(item.notes),
        ].join(",");
      }

      return [
        escapeCSV(item.deviceName),
        escapeCSV(item.storage),
        escapeCSV(item.imei),
        sell,
        escapeCSV(item.status),
        escapeCSV(item.clientOrSupplier),
        escapeCSV(item.notes),
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `DELTA_TECHNOLOGY_Backup_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

  const handleSaveDevice = async (e) => {
    e.preventDefault();
    if (!formData.deviceName.trim()) return;

    const payload = {
      deviceName: formData.deviceName,
      imei: formData.imei,
      storage: formData.storage,
      condition: formData.condition,
      buyPrice: isAdmin
        ? Number(formData.buyPrice) || 0
        : editingItem
        ? Number(editingItem.buyPrice) || 0
        : 0,
      sellPrice: Number(formData.sellPrice) || 0,
      status: formData.status,
      clientOrSupplier: formData.clientOrSupplier,
      notes: formData.notes,
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
      alert("حدث خطأ أثناء الحفظ. تأكد من صلاحيات الحساب.");
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm("هل أنت متأكد من حذف هذا الجهاز نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, "artifacts", appId, "public", "data", "devices", id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("فشل الحذف: الصلاحية متاحة لحساب الإدارة فقط.");
    }
  };

  if (authLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-400">جاري التحقق من الجلسة...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center text-cyan-400 mx-auto">
              <IconPhone className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">DELTA TECHNOLOGY</h1>
            <p className="text-xs text-slate-400">تسجيل الدخول إلى نظام إدارة وحسابات الأجهزة</p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3 rounded-xl text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                required
                dir="ltr"
                placeholder="admin@delta.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white text-left focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">كلمة المرور</label>
              <input
                type="password"
                required
                dir="ltr"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white text-left focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-sm transition"
            >
              {isLoggingIn ? "جاري الدخول..." : "تسجيل الدخول"}
            </button>
          </form>
        </div>
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
              <IconPhone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide text-white">DELTA TECHNOLOGY</h1>
              <p className="text-xs text-slate-400">نظام إدارة وحسابات الأجهزة • مول دايموند</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border ${
                isAdmin
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                  : "bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              <IconShield className="w-4 h-4" />
              <span>{isAdmin ? "مدير النظام" : "موظف مبيعات"}</span>
            </div>

            <button
              onClick={handleCSVExport}
              title="تنزيل نسخة احتياطية بصيغة CSV"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 px-3.5 py-2 rounded-xl text-sm font-medium transition"
            >
              <IconDownload className="w-4 h-4" />
              <span>تصدير CSV</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              title="ترتيب الأعمدة: اسم الجهاز، المساحة، IMEI، سعر الشراء، سعر البيع، الحالة، العميل، ملاحظات"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-sm font-medium transition"
            >
              <IconUpload className="w-4 h-4" />
              <span>{importing ? "جاري الاستيراد..." : "استيراد CSV"}</span>
            </button>

            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              <IconPlus className="w-4 h-4" />
              <span>إضافة جهاز</span>
            </button>

            <button
              onClick={handleLogout}
              title="تسجيل الخروج"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 transition"
            >
              <IconLogout className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-3 rounded-xl text-sm">
            {errorMsg}
          </div>
        )}

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-sm text-slate-400 mb-2">الأجهزة المتاحة بالمخزن</div>
            <p className="text-2xl font-bold text-white">{stats.availableCount} جهاز</p>
            <p className="text-xs text-slate-500 mt-1">من إجمالي {stats.totalDevices} مسجل</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-sm text-slate-400 mb-2">إجمالي المبيعات</div>
            <p className="text-2xl font-bold text-emerald-400">
              {stats.totalRevenue.toLocaleString()} ج.م
            </p>
            <p className="text-xs text-slate-500 mt-1">للأجهزة المباعة</p>
          </div>

          {isAdmin ? (
            <>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="text-sm text-slate-400 mb-2">صافي الأرباح</div>
                <p className="text-2xl font-bold text-amber-400">
                  {stats.totalProfit.toLocaleString()} ج.م
                </p>
                <p className="text-xs text-slate-500 mt-1">خاص بالإدارة فقط</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="text-sm text-slate-400 mb-2">رأس مال المخزن الحالي</div>
                <p className="text-2xl font-bold text-purple-400">
                  {stats.inventoryCost.toLocaleString()} ج.م
                </p>
                <p className="text-xs text-slate-500 mt-1">تكلفة الأجهزة المتاحة</p>
              </div>
            </>
          ) : (
            <div className="sm:col-span-2 bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-center text-slate-500 text-sm gap-2">
              <IconLock className="w-4 h-4" />
              <span>بيانات التكلفة وصافي الأرباح محجوبة لحساب المبيعات</span>
            </div>
          )}
        </div>

        {/* شريط البحث والفلترة */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2">
              <IconSearch className="w-5 h-5" />
            </span>
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
          {dataLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm">جاري تحميل الأجهزة...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-medium">الجهاز والمواصفات</th>
                    <th className="py-3.5 px-4 font-medium">IMEI / السيريال</th>
                    <th className="py-3.5 px-4 font-medium">الحالة</th>
                    {isAdmin && <th className="py-3.5 px-4 font-medium">سعر الشراء</th>}
                    <th className="py-3.5 px-4 font-medium">سعر البيع</th>
                    {isAdmin && <th className="py-3.5 px-4 font-medium">الربح</th>}
                    <th className="py-3.5 px-4 font-medium">العميل / المورد</th>
                    <th className="py-3.5 px-4 font-medium text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredDevices.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 8 : 6} className="py-12 text-center text-slate-500">
                        لا توجد أجهزة مطابقة حالياً. اضغط على «إضافة جهاز» أو «استيراد CSV» للبدء.
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
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                item.status === "متاح"
                                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                  : item.status === "مباع"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="py-3.5 px-4 text-slate-300">
                              {Number(item.buyPrice || 0).toLocaleString()} ج.م
                            </td>
                          )}
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {Number(item.sellPrice || 0).toLocaleString()} ج.م
                          </td>
                          {isAdmin && (
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
                                <IconEdit className="w-4 h-4" />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  title="حذف"
                                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                                >
                                  <IconTrash className="w-4 h-4" />
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
          )}
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
                <IconClose className="w-5 h-5" />
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
                {isAdmin && (
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
                <div className={isAdmin ? "" : "sm:col-span-2"}>
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
    </div>
  );
}
