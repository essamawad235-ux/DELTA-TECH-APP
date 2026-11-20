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
// 1. إعدادات Firebase (بدون process.env عشان يبني على أي بيئة فوراً)
// ==========================================
// ملحوظة: اتأكد إن projectId و appId هنا هم نفس اللي في Project Settings في Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDMTlRJIU7n9FS4RwJ8anvXnHG2CEjSMBE",
  authDomain: "delta-tech-app.firebaseapp.com",
  projectId: "delta-tech-app",
  storageBucket: "delta-tech-app.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000",
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

  // استيراد البيانات من ملف CSV (شيت الحسابات)
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

      // تخطي صف العناوين الأول وقراءة باقي الصفوف
      const batch = writeBatch(db);
      const colRef = collection(db, "artifacts", appId, "public", "data", "devices");
      let count = 0;

      for (let i = 1; i < lines.length; i++) {
        // تقسيم الأعمدة مع مراعاة الفواصل
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
      <header className="bg-slate-9
