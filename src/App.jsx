import LOGO from './logo.js';
import Hero, { Services } from './Hero.jsx';
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
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  setDoc,
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
const PUBLIC_CATALOG_FIELDS = ["deviceName", "deviceType", "specs", "expectedSellPrice", "status", "orderIndex"];
// حقول العرض العامة فقط، بدون أسعار شراء أو سيريال أو ملاحظات أو أسماء موردين
const toPublicCatalogDoc = (d, createdAt) => {
  const o = {};
  PUBLIC_CATALOG_FIELDS.forEach((k) => {
    o[k] = d[k] === undefined ? null : d[k];
  });
  o.createdAt = createdAt || d.createdAt || serverTimestamp();
  return o;
};
const ADMIN_EMAIL = "admin@delta.com";
const DEFAULT_CAPITAL = 175000;

const SHOP_INFO = {
  name: "DELTA TECHNOLOGY",
  address: "مول دايموند، الدور الأول علوي، الحصري، 6 أكتوبر",
  phones: ["01111860871", "01121410749"],
  whatsapp: "201111860871",
};

const OTHER_ACCOUNTS = ["بيكا", "الهواري"];
const OTHER_ACCOUNT_LABELS = {
  "بيكا": { due: "مستحق لبيكا", cost: "بتكلفة بيكا" },
  "الهواري": { due: "مستحق للهواري", cost: "بتكلفة الهواري" },
};
const isOtherAccount = (d) => d && OTHER_ACCOUNTS.includes(d.clientOrSupplier);
const DEVICE_TYPES = ["موبايل", "تابلت", "ساعة", "بلايستيشن", "لابتوب", "أخرى"];

const INVOICE_TERMS = [
  "يسري الضمان لمدة 14 يوماً من تاريخ الفاتورة على عيوب الصناعة فقط.",
  "المحل غير مسؤول عن أي ضرائب أو رسوم حكومية أو ضريبية متعلقة بالجهاز بعد البيع.",
  "الضمان لا يشمل سوء الاستخدام أو الكسر أو الخدش أو تعرض الجهاز للسوائل أو العبث به خارج المحل.",
  "يجب الاحتفاظ بالفاتورة وحالة الجهاز كما تم استلامه وقت الفحص عند أي مراجعة خلال فترة الضمان.",
];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// الـ 20 جهاز المسحوبين من شيت Hessabat_ElAgheza_Abdo مع تحديد النوع
const GOOGLE_SHEETS_DEVICES = [
  { deviceName: "13 pro max", deviceType: "موبايل", buyPrice: 29000, expectedSellPrice: 34000, sellPrice: 34000, status: "مباع", imei: "350000000000001", specs: "مستعمل - حالة ممتازة", accessories: "", notes: "" },
  { deviceName: "TAB A6", deviceType: "تابلت", buyPrice: 2000, expectedSellPrice: 2800, sellPrice: 0, status: "متاح", imei: "350000000000002", specs: "تابلت - حالة جيدة", accessories: "", notes: "" },
  { deviceName: "13 pro max", deviceType: "موبايل", buyPrice: 17300, expectedSellPrice: 21500, sellPrice: 0, status: "متاح", imei: "350000000000003", specs: "مستعمل - حالة جيدة", accessories: "", notes: "" },
  { deviceName: "ip 7 p", deviceType: "موبايل", buyPrice: 2800, expectedSellPrice: 3800, sellPrice: 0, status: "متاح", imei: "350000000000004", specs: "مستعمل - حالة جيدة", accessories: "", notes: "" },
  { deviceName: "ipad mini 1", deviceType: "تابلت", buyPrice: 1000, expectedSellPrice: 1600, sellPrice: 0, status: "متاح", imei: "350000000000005", specs: "آيباد ميني - حالة جيدة", accessories: "", notes: "" },
  { deviceName: "ps4", deviceType: "بلايستيشن", buyPrice: 3700, expectedSellPrice: 5200, sellPrice: 0, status: "متاح", imei: "PS4-000006", specs: "بلايستيشن 4", accessories: "", notes: "" },
  { deviceName: "xmax", deviceType: "موبايل", buyPrice: 7700, expectedSellPrice: 8500, sellPrice: 8500, status: "مباع", imei: "350000000000007", specs: "مستعمل - حالة ممتازة", accessories: "", notes: "" },
  { deviceName: "ps4", deviceType: "بلايستيشن", buyPrice: 7500, expectedSellPrice: 10000, sellPrice: 10000, status: "مباع", imei: "PS4-000008", specs: "بلايستيشن 4", accessories: "", notes: "" },
  { deviceName: "Tab a7", deviceType: "تابلت", buyPrice: 3100, expectedSellPrice: 4200, sellPrice: 0, status: "متاح", imei: "350000000000009", specs: "تابلت - حالة جيدة", accessories: "", notes: "" },
  { deviceName: "A17", deviceType: "موبايل", buyPrice: 8300, expectedSellPrice: 9850, sellPrice: 9850, status: "مباع", imei: "350000000000010", specs: "مستعمل - حالة ممتازة", accessories: "", notes: "" },
  { deviceName: "Xr", deviceType: "موبايل", buyPrice: 5500, expectedSellPrice: 6000, sellPrice: 6000, status: "مباع", imei: "350000000000011", specs: "مستعمل - حالة جيدة", accessories: "", notes: "" },
  { deviceName: "Ps3", deviceType: "بلايستيشن", buyPrice: 1500, expectedSellPrice: 2300, sellPrice: 0, status: "متاح", imei: "PS3-000012", specs: "بلايستيشن 3", accessories: "", notes: "" },
  { deviceName: "ip 14 pro max", deviceType: "موبايل", buyPrice: 32700, expectedSellPrice: 37000, sellPrice: 0, status: "متاح", imei: "350000000000013", specs: "مستعمل - حالة ممتازة", accessories: "", notes: "" },
  { deviceName: "ip 13", deviceType: "موبايل", buyPrice: 20000, expectedSellPrice: 23500, sellPrice: 0, status: "متاح", imei: "350000000000014", specs: "مستعمل - حالة ممتازة", accessories: "", notes: "" },
  { deviceName: "ip 11", deviceType: "موبايل", buyPrice: 10500, expectedSellPrice: 11500, sellPrice: 11500, status: "مباع", imei: "350000000000015", specs: "مستعمل - حالة جيدة", accessories: "", notes: "" },
  { deviceName: "ip 11", deviceType: "موبايل", buyPrice: 9500, expectedSellPrice: 12000, sellPrice: 0, status: "متاح", imei: "350000000000016", specs: "مستعمل - حالة جيدة", accessories: "", notes: "" },
  { deviceName: "ip 12", deviceType: "موبايل", buyPrice: 8500, expectedSellPrice: 11500, sellPrice: 11500, status: "مباع", imei: "350000000000017", specs: "مستعمل - حالة ممتازة", accessories: "", notes: "" },
  { deviceName: "IP11", deviceType: "موبايل", buyPrice: 11500, expectedSellPrice: 13500, sellPrice: 0, status: "متاح", imei: "350000000000018", specs: "مستعمل - حالة ممتازة", accessories: "", notes: "" },
  { deviceName: "IP 13 PRO MAX", deviceType: "موبايل", buyPrice: 16000, expectedSellPrice: 20500, sellPrice: 0, status: "متاح", imei: "350000000000019", specs: "مستعمل - حالة جيدة", accessories: "", notes: "" },
  { deviceName: "A50", deviceType: "موبايل", buyPrice: 1500, expectedSellPrice: 2400, sellPrice: 0, status: "متاح", imei: "350000000000020", specs: "مستعمل - حالة جيدة", accessories: "", notes: "" },
];

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

const IconDatabase = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
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

const IconTag = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const IconPrint = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const IconLink = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const [copiedId, setCopiedId] = useState("");
  const fileInputRef = useRef(null);

  // قراءة معرف الجهاز من الرابط لو العميل فاتح رابط جهاز محدد (?device=...)
  const [focusedDeviceId, setFocusedDeviceId] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("device") || "";
    } catch {
      return "";
    }
  });

  // تسجيل الدخول
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const isStaff = Boolean(user);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // تبويب الإدارة (الأجهزة / سجل الرقابة)
  const [activeTab, setActiveTab] = useState("devices");

  // صندوق رأس المال الأصلي
  const [originalCapital, setOriginalCapital] = useState(DEFAULT_CAPITAL);
  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [capitalInput, setCapitalInput] = useState(String(DEFAULT_CAPITAL));

  // بيانات الأجهزة وسجل الرقابة
  const [devices, setDevices] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // نافذة «بيع» السريعة
  const [sellingItem, setSellingItem] = useState(null);
  const [quickSellPrice, setQuickSellPrice] = useState("");
  const [quickSellAccessories, setQuickSellAccessories] = useState("");
  const [quickSellNotes, setQuickSellNotes] = useState("");
  const [isSellingSaving, setIsSellingSaving] = useState(false);

  // نافذة فاتورة البيع
  const [invoiceItem, setInvoiceItem] = useState(null);

  // نافذة إضافة / تعديل جهاز
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    deviceName: "",
    deviceType: "موبايل",
    imei: "",
    specs: "",
    buyPrice: "",
    expectedSellPrice: "",
    sellPrice: "",
    status: "متاح",
    clientOrSupplier: "عبدو",
    accessories: "",
    notes: "",
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setShowLoginModal(false);
      } else {
        setActiveTab("devices");
      }
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // جلب الأجهزة
  useEffect(() => {
    setDataLoading(true);
    const devicesCollectionRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      user ? "devices" : "public_catalog"
    );

    const unsubscribeData = onSnapshot(
      devicesCollectionRef,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        list.sort(
          (a, b) =>
            (a.orderIndex ?? 999) - (b.orderIndex ?? 999) ||
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
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

  // نسخة عامة للزوار: الأجهزة المتاحة فقط وبحقول العرض فقط (بدون أسعار شراء أو سيريال أو أسماء موردين)
  const [publicCatalogDocs, setPublicCatalogDocs] = useState(null);
  useEffect(() => {
    if (!user) {
      setPublicCatalogDocs(null);
      return;
    }
    const unsub = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "public_catalog"),
      (snap) => {
        const m = {};
        snap.docs.forEach((d) => {
          m[d.id] = d.data();
        });
        setPublicCatalogDocs(m);
      },
      (err) => console.error("public_catalog error:", err)
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || dataLoading || publicCatalogDocs === null) return;
    const PUBLIC_FIELDS = PUBLIC_CATALOG_FIELDS;
    const desired = {};
    devices.forEach((d) => {
      if (d.status !== "متاح") return;
      const o = {};
      PUBLIC_FIELDS.forEach((k) => {
        o[k] = d[k] === undefined ? null : d[k];
      });
      desired[d.id] = { ...o, createdAt: d.createdAt || serverTimestamp() };
    });
    const batch = writeBatch(db);
    let ops = 0;
    Object.keys(desired).forEach((id) => {
      const cur = publicCatalogDocs[id];
      const same =
        cur && PUBLIC_FIELDS.every((k) => (cur[k] === undefined ? null : cur[k]) === desired[id][k]);
      if (!same && ops < 400) {
        batch.set(doc(db, "artifacts", appId, "public", "data", "public_catalog", id), desired[id]);
        ops++;
      }
    });
    Object.keys(publicCatalogDocs).forEach((id) => {
      if (!desired[id] && ops < 400) {
        batch.delete(doc(db, "artifacts", appId, "public", "data", "public_catalog", id));
        ops++;
      }
    });
    if (ops > 0) batch.commit().catch((err) => console.error("public_catalog sync error:", err));
  }, [user, devices, dataLoading, publicCatalogDocs]);

  // جلب رأس المال وسجل الرقابة للمدير
  useEffect(() => {
    if (!isAdmin) return;

    const settingsDocRef = doc(db, "artifacts", appId, "public", "data", "settings", "capital");
    const unsubscribeCapital = onSnapshot(
      settingsDocRef,
      (docSnap) => {
        if (docSnap.exists() && docSnap.data().originalCapital !== undefined) {
          const val = Number(docSnap.data().originalCapital) || DEFAULT_CAPITAL;
          setOriginalCapital(val);
          setCapitalInput(String(val));
        }
      },
      () => {}
    );

    const auditRef = collection(db, "artifacts", appId, "public", "data", "audit_logs");
    const unsubscribeAudit = onSnapshot(
      auditRef,
      (snapshot) => {
        const logs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        logs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setAuditLogs(logs);
      },
      () => {}
    );

    return () => {
      unsubscribeCapital();
      unsubscribeAudit();
    };
  }, [isAdmin]);

  // تسجيل حركة في سجل الرقابة
  const recordAuditLog = async (actionType, deviceName, details = "") => {
    if (!user?.email) return;
    try {
      const auditRef = collection(db, "artifacts", appId, "public", "data", "audit_logs");
      await addDoc(auditRef, {
        actorEmail: user.email,
        actionType,
        deviceName,
        details,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Audit log error:", err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setEmail("");
      setPassword("");
      setShowLoginModal(false);
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

  // نسخ رابط مباشر للجهاز المتاح
  const handleCopyDeviceLink = async (deviceId) => {
    const url = `${window.location.origin}${window.location.pathname}?device=${encodeURIComponent(deviceId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(deviceId);
      setTimeout(() => setCopiedId(""), 2000);
    } catch {
      window.prompt("انسخ رابط الجهاز:", url);
    }
  };

  // فحص السيريال / IMEI المكرر
  const duplicateImeiDevice = useMemo(() => {
    const cleanImei = formData.imei.trim().toLowerCase();
    if (!cleanImei) return null;
    return devices.find(
      (d) =>
        d.id !== editingItem?.id &&
        String(d.imei || "").trim().toLowerCase() === cleanImei
    );
  }, [formData.imei, devices, editingItem]);

  // فتح نافذة «بيع» السريعة
  const openQuickSellModal = (item) => {
    setSellingItem(item);
    setQuickSellPrice(
      Number(item.sellPrice) > 0
        ? String(item.sellPrice)
        : Number(item.expectedSellPrice) > 0
        ? String(item.expectedSellPrice)
        : ""
    );
    setQuickSellAccessories(item.accessories || "");
    setQuickSellNotes(item.notes || "");
  };

  // تأكيد البيع السريع
  const handleConfirmQuickSell = async (e) => {
    e.preventDefault();
    if (!sellingItem) return;
    const finalSell = Number(quickSellPrice);
    if (!finalSell || finalSell <= 0) {
      alert("من فضلك أدخل سعر البيع الفعلي.");
      return;
    }

    setIsSellingSaving(true);
    try {
      const docRef = doc(db, "artifacts", appId, "public", "data", "devices", sellingItem.id);
      const updatedFields = {
        sellPrice: finalSell,
        status: "مباع",
        accessories: quickSellAccessories.trim(),
        notes: quickSellNotes.trim(),
        updatedAt: serverTimestamp(),
      };
      const sellBatch = writeBatch(db);
      sellBatch.update(docRef, updatedFields);
      sellBatch.delete(doc(db, "artifacts", appId, "public", "data", "public_catalog", sellingItem.id));
      await sellBatch.commit();
      await recordAuditLog(
        "تسجيل بيع سريع",
        sellingItem.deviceName,
        `سعر البيع: ${finalSell.toLocaleString()} ج.م`
      );
      const soldSnapshot = { ...sellingItem, ...updatedFields };
      setSellingItem(null);
      if (window.confirm("تم تسجيل البيع بنجاح! هل تريد فتح فاتورة البيع الآن؟")) {
        setInvoiceItem(soldSnapshot);
      }
    } catch (err) {
      console.error("Quick sell error:", err);
      alert("حدث خطأ أثناء تسجيل البيع.");
    } finally {
      setIsSellingSaving(false);
    }
  };

  // حفظ تعديل رأس المال الأصلي
  const handleSaveCapital = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const newVal = Number(capitalInput) || 0;
    try {
      const settingsDocRef = doc(db, "artifacts", appId, "public", "data", "settings", "capital");
      await setDoc(settingsDocRef, { originalCapital: newVal, updatedAt: serverTimestamp() }, { merge: true });
      setOriginalCapital(newVal);
      setIsEditingCapital(false);
    } catch (err) {
      console.error("Error saving capital:", err);
      setOriginalCapital(newVal);
      setIsEditingCapital(false);
    }
  };

  // رفع بيانات الـ 20 جهاز من شيت الحسابات
  const handleSyncGoogleSheetData = async () => {
    if (!isAdmin) return;
    if (!window.confirm(`هل تريد استيراد الـ ${GOOGLE_SHEETS_DEVICES.length} جهاز من شيت الحسابات الآن؟`)) {
      return;
    }

    setImporting(true);
    try {
      const batch = writeBatch(db);
      const colRef = collection(db, "artifacts", appId, "public", "data", "devices");

      GOOGLE_SHEETS_DEVICES.forEach((item, index) => {
        const newDocRef = doc(colRef);
        if ((item.status || "متاح") === "متاح") {
          batch.set(
            doc(db, "artifacts", appId, "public", "data", "public_catalog", newDocRef.id),
            toPublicCatalogDoc({ ...item, status: "متاح", orderIndex: index + 1 })
          );
        }
        batch.set(newDocRef, {
          orderIndex: index + 1,
          deviceName: item.deviceName,
          deviceType: item.deviceType || "موبايل",
          specs: item.specs || "",
          imei: item.imei || "",
          buyPrice: item.buyPrice || 0,
          expectedSellPrice: item.expectedSellPrice || 0,
          sellPrice: item.sellPrice || 0,
          status: item.status || "متاح",
          clientOrSupplier: "عبدو",
          accessories: item.accessories || "",
          notes: item.notes || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      await recordAuditLog("استيراد شيت الحسابات", `${GOOGLE_SHEETS_DEVICES.length} جهاز`, "Hessabat_ElAgheza_Abdo");
      alert(`تم رفع ${GOOGLE_SHEETS_DEVICES.length} جهاز بنجاح!`);
    } catch (err) {
      console.error("Sync error:", err);
      alert("حدث خطأ أثناء رفع البيانات. تأكد من إعدادات Firestore Rules.");
    } finally {
      setImporting(false);
    }
  };

  // استيراد CSV
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
        const csvStatus = cols[7] && ["متاح", "مباع", "صيانة"].includes(cols[7]) ? cols[7] : "متاح";
        if (csvStatus === "متاح") {
          batch.set(
            doc(db, "artifacts", appId, "public", "data", "public_catalog", newDocRef.id),
            toPublicCatalogDoc({
              deviceName: cols[0] || "جهاز غير محدد",
              deviceType: DEVICE_TYPES.includes(cols[1]) ? cols[1] : "موبايل",
              specs: cols[2] || "",
              expectedSellPrice: Number(cols[5]) || 0,
              status: "متاح",
              orderIndex: null,
            })
          );
        }
        batch.set(newDocRef, {
          deviceName: cols[0] || "جهاز غير محدد",
          deviceType: DEVICE_TYPES.includes(cols[1]) ? cols[1] : "موبايل",
          specs: cols[2] || "",
          imei: cols[3] || "",
          buyPrice: isAdmin ? Number(cols[4]) || 0 : 0,
          expectedSellPrice: Number(cols[5]) || 0,
          sellPrice: Number(cols[6]) || 0,
          status: cols[7] && ["متاح", "مباع", "صيانة"].includes(cols[7]) ? cols[7] : "متاح",
          clientOrSupplier: cols[8] || "عبدو",
          accessories: cols[9] || "",
          notes: cols[10] || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        count++;
      }

      await batch.commit();
      await recordAuditLog("استيراد CSV", `${count} جهاز`, file.name);
      alert(`تم استيراد ${count} جهاز بنجاح!`);
    } catch (err) {
      console.error("CSV Import error:", err);
      alert("حدث خطأ أثناء قراءة الملف. تأكد إنه محفوظ بصيغة CSV UTF-8.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // تصدير CSV
  const handleCSVExport = () => {
    if (devices.length === 0) {
      alert("لا توجد بيانات لتصديرها حالياً.");
      return;
    }

    const headers = isAdmin
      ? ["م", "اسم الجهاز", "النوع", "سعر الشراء", "سعر البيع المتوقع", "سعر البيع", "حالة الجهاز (مواصفات)", "IMEI", "صافي ربح الجهاز", "الحالة", "ملحقات / ضمان", "ملاحظات"]
      : ["م", "اسم الجهاز", "النوع", "سعر البيع المتوقع", "سعر البيع", "حالة الجهاز (مواصفات)", "IMEI", "الحالة", "ملحقات / ضمان", "ملاحظات"];

    const escapeCSV = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;

    const rows = devices.map((item, idx) => {
      const buy = Number(item.buyPrice) || 0;
      const expected = Number(item.expectedSellPrice) || 0;
      const sell = Number(item.sellPrice) || 0;
      const profit = item.status === "مباع" ? sell - buy : 0;

      if (isAdmin) {
        return [
          idx + 1,
          escapeCSV(item.deviceName),
          escapeCSV(item.deviceType || "موبايل"),
          buy,
          expected || "",
          sell || "",
          escapeCSV(item.specs),
          escapeCSV(item.imei),
          profit,
          escapeCSV(item.status),
          escapeCSV(item.accessories),
          escapeCSV(item.notes),
        ].join(",");
      }

      return [
        idx + 1,
        escapeCSV(item.deviceName),
        escapeCSV(item.deviceType || "موبايل"),
        expected || "",
        sell || "",
        escapeCSV(item.specs),
        escapeCSV(item.imei),
        escapeCSV(item.status),
        escapeCSV(item.accessories),
        escapeCSV(item.notes),
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `DELTA_TECHNOLOGY_Hessabat_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // الإحصائيات المالية
  const stats = useMemo(() => {
    const ownDevices = devices.filter((d) => !isOtherAccount(d));
    const otherByAccount = {};
    OTHER_ACCOUNTS.forEach((acc) => {
      const devs = devices.filter((d) => d.clientOrSupplier === acc);
      const sold = devs.filter((d) => d.status === "مباع");
      const available = devs.filter((d) => d.status === "متاح" || d.status === "صيانة");
      otherByAccount[acc] = {
        soldCount: sold.length,
        availableCount: available.length,
        due: sold.reduce((sum, d) => sum + (Number(d.buyPrice) || 0), 0),
        profit: sold.reduce((sum, d) => sum + ((Number(d.sellPrice) || 0) - (Number(d.buyPrice) || 0)), 0),
        stockCost: available.reduce((sum, d) => sum + (Number(d.buyPrice) || 0), 0),
      };
    });
    const totalDevices = ownDevices.length;
    const availableDevices = ownDevices.filter((d) => d.status === "متاح" || d.status === "صيانة");
    const availableCount = availableDevices.length;

    const soldDevices = ownDevices.filter((d) => d.status === "مباع");
    const soldCount = soldDevices.length;

    const totalRevenue = soldDevices.reduce((sum, d) => sum + (Number(d.sellPrice) || 0), 0);
    const totalProfit = soldDevices.reduce(
      (sum, d) => sum + ((Number(d.sellPrice) || 0) - (Number(d.buyPrice) || 0)),
      0
    );

    const abdoShare = totalProfit * 0.4;
    const adminShare = totalProfit * 0.6;

    const inventoryCost = availableDevices.reduce((sum, d) => sum + (Number(d.buyPrice) || 0), 0);
    const remainingCapitalCash = originalCapital - inventoryCost;
    const totalCashInHand = remainingCapitalCash + totalProfit;

    return {
      totalDevices,
      availableCount,
      soldCount,
      totalRevenue,
      totalProfit,
      abdoShare,
      adminShare,
      inventoryCost,
      remainingCapitalCash,
      totalCashInHand,
      otherByAccount,
    };
  }, [devices, originalCapital]);

  // الأجهزة المتاحة للعملاء (مع دعم التركيز على جهاز من الرابط)
  const customerDevices = useMemo(() => {
    const list = devices.filter((item) => {
      const isAvailable = item.status === "متاح";
      const matchesType = typeFilter === "all" || (item.deviceType || "موبايل") === typeFilter;
      const matchesSearch =
        item.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.specs?.toLowerCase().includes(searchTerm.toLowerCase());
      return isAvailable && matchesType && matchesSearch;
    });

    const sorted = [...list].sort((a, b) => (Number(b.expectedSellPrice) || 0) - (Number(a.expectedSellPrice) || 0));
    if (!focusedDeviceId) return sorted;
    return [...sorted].sort((a, b) => (a.id === focusedDeviceId ? -1 : b.id === focusedDeviceId ? 1 : 0));
  }, [devices, searchTerm, typeFilter, focusedDeviceId]);

  const focusedDeviceNotAvailable = useMemo(() => {
    if (!focusedDeviceId || dataLoading) return false;
    const found = devices.find((d) => d.id === focusedDeviceId);
    return !found || found.status !== "متاح";
  }, [focusedDeviceId, devices, dataLoading]);

  // الأجهزة للموظفين والإدارة
  const filteredDevices = useMemo(() => {
    return devices.filter((item) => {
      const matchesSearch =
        item.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.specs?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesType = typeFilter === "all" || (item.deviceType || "موبايل") === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [devices, searchTerm, statusFilter, typeFilter]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      deviceName: "",
      deviceType: "موبايل",
      imei: "",
      specs: "",
      buyPrice: "",
      expectedSellPrice: "",
      sellPrice: "",
      status: "متاح",
      clientOrSupplier: "عبدو",
      accessories: "",
      notes: "",
    });
    setIsFormOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      deviceName: item.deviceName || "",
      deviceType: item.deviceType || "موبايل",
      imei: item.imei || "",
      specs: item.specs || item.storage || "",
      buyPrice: item.buyPrice ?? "",
      expectedSellPrice: item.expectedSellPrice ?? "",
      sellPrice: item.sellPrice ?? "",
      status: item.status || "متاح",
      clientOrSupplier: item.clientOrSupplier || "عبدو",
      accessories: item.accessories || "",
      notes: item.notes || "",
    });
    setIsFormOpen(true);
  };

  // حفظ جهاز مع إلزامية كل الحقول ما عدا الملاحظات (والملحقات اختيارية) ومنع تكرار السيريال
  const handleSaveDevice = async (e) => {
    e.preventDefault();

    if (duplicateImeiDevice) {
      alert(`تنبيه: السيريال / IMEI (${formData.imei.trim()}) مسجل بالفعل على جهاز "${duplicateImeiDevice.deviceName}".`);
      return;
    }

    if (!formData.deviceName.trim() || !formData.specs.trim() || !formData.imei.trim()) {
      alert("من فضلك املأ اسم الجهاز، المواصفات، والسيريال IMEI.");
      return;
    }

    const expectedVal = Number(formData.expectedSellPrice);
    if (!expectedVal || expectedVal <= 0) {
      alert("من فضلك أدخل سعر البيع المتوقع.");
      return;
    }

    if (!editingItem && isAdmin) {
      const buyVal = Number(formData.buyPrice);
      if (!buyVal || buyVal <= 0) {
        alert("من فضلك أدخل سعر الشراء.");
        return;
      }
    }

    const sellVal = Number(formData.sellPrice) || 0;
    const finalStatus =
      !editingItem && sellVal > 0 && formData.status === "متاح" ? "مباع" : formData.status;

    const payload = {
      deviceName: formData.deviceName.trim(),
      deviceType: formData.deviceType || "موبايل",
      imei: formData.imei.trim(),
      specs: formData.specs.trim(),
      buyPrice: isAdmin
        ? Number(formData.buyPrice) || 0
        : editingItem
        ? Number(editingItem.buyPrice) || 0
        : 0,
      expectedSellPrice: expectedVal,
      sellPrice: sellVal,
      status: finalStatus,
      clientOrSupplier: formData.clientOrSupplier || "عبدو",
      accessories: formData.accessories.trim(),
      notes: formData.notes.trim(),
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingItem) {
        const docRef = doc(db, "artifacts", appId, "public", "data", "devices", editingItem.id);
        const editBatch = writeBatch(db);
        editBatch.update(docRef, payload);
        const pubRef = doc(db, "artifacts", appId, "public", "data", "public_catalog", editingItem.id);
        if (payload.status === "متاح") {
          editBatch.set(
            pubRef,
            toPublicCatalogDoc({ ...payload, orderIndex: editingItem.orderIndex }, editingItem.createdAt)
          );
        } else {
          editBatch.delete(pubRef);
        }
        await editBatch.commit();
        await recordAuditLog(
          "تعديل جهاز",
          payload.deviceName,
          `الحالة: ${payload.status} | بيع متوقع: ${expectedVal.toLocaleString()} | بيع فعلي: ${sellVal.toLocaleString()}`
        );
      } else {
        const colRef = collection(db, "artifacts", appId, "public", "data", "devices");
        const newRef = doc(colRef);
        const newBatch = writeBatch(db);
        newBatch.set(newRef, {
          ...payload,
          orderIndex: devices.length + 1,
          createdAt: serverTimestamp(),
        });
        if (payload.status === "متاح") {
          newBatch.set(
            doc(db, "artifacts", appId, "public", "data", "public_catalog", newRef.id),
            toPublicCatalogDoc({ ...payload, orderIndex: devices.length + 1 })
          );
        }
        await newBatch.commit();
        await recordAuditLog(
          "إضافة جهاز جديد",
          payload.deviceName,
          `النوع: ${payload.deviceType} | سيريال: ${payload.imei}`
        );
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error("Save error:", err);
      alert("حدث خطأ أثناء الحفظ. تأكد من صلاحيات الحساب.");
    }
  };

  const handleDelete = async (item) => {
    if (!isAdmin) return;
    if (!window.confirm(`هل أنت متأكد من حذف "${item.deviceName}" نهائياً؟`)) return;
    try {
      const delBatch = writeBatch(db);
      delBatch.delete(doc(db, "artifacts", appId, "public", "data", "devices", item.id));
      delBatch.delete(doc(db, "artifacts", appId, "public", "data", "public_catalog", item.id));
      await delBatch.commit();
      await recordAuditLog("حذف جهاز", item.deviceName, `سيريال: ${item.imei || "—"}`);
    } catch (err) {
      console.error("Delete error:", err);
      alert("فشل الحذف: الصلاحية متاحة لحساب الإدارة فقط.");
    }
  };

  const formatAuditDate = (ts) => {
    if (!ts?.seconds) return "الآن";
    return new Date(ts.seconds * 1000).toLocaleString("ar-EG", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  if (authLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-400">جاري التحميل...</p>
      </div>
    );
  }

  // ==========================================
  // 1. واجهة العملاء (زوار الموقع بدون حساب)
  // ==========================================
  if (!isStaff) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        <header className="bg-slate-950/90 border-b border-slate-800/80 sm:sticky sm:top-0 z-30 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={LOGO} alt={SHOP_INFO.name} width="44" height="44" className="w-11 h-11 rounded-xl border border-cyan-500/30 object-cover" />
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-wide text-white">{SHOP_INFO.name}</h1>
                <p className="text-[11px] sm:text-xs text-slate-400">{SHOP_INFO.address}</p>
              </div>
            </div>

            <nav className="order-last sm:order-none w-full sm:w-auto flex gap-2">
              <a
                href="#valuation"
                onClick={(e) => { const t = document.getElementById("valuation"); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: "smooth" }); } }}
                className="flex-1 sm:flex-none text-center bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2.5 rounded-xl text-sm font-bold transition"
              >
                قيّم جهازك
              </a>
              <a
                href="#new-iphone"
                onClick={(e) => { const t = document.getElementById("new-iphone"); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: "smooth" }); } }}
                className="flex-1 sm:flex-none text-center bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                آيفون جديد
              </a>
              <a
                href={`https://wa.me/${SHOP_INFO.whatsapp}?text=${encodeURIComponent("عايز أسأل عن آيفون معين: ")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none text-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl text-sm font-extrabold transition"
              >
                واتساب
              </a>
              <a
                href="#services"
                onClick={(e) => { const t = document.getElementById("services"); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: "smooth" }); } }}
                className="hidden sm:inline-block text-center bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                خدماتنا
              </a>
            </nav>

            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2 text-slate-500 hover:text-cyan-300 px-2 py-2 rounded-xl text-[11px] sm:text-xs transition"
            >
              <IconLock className="w-3.5 h-3.5" />
              <span>دخول الموظفين / الإدارة</span>
            </button>
          </div>
        </header>
        <section className="max-w-7xl mx-auto px-4 pt-5">
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/70 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">عندنا كمان آيفونات تانية</h2>
              <p className="text-sm sm:text-base text-slate-300 mt-1">مش لاقي الجهاز اللي عايزه؟ ابعتلنا اسم الموديل والمساحة على واتساب ونرد عليك بالمتاح والسعر.</p>
            </div>
            <a
              href={`https://wa.me/${SHOP_INFO.whatsapp}?text=${encodeURIComponent("عايز أسأل عن آيفون معين: ")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-4 rounded-2xl text-lg font-extrabold transition"
            >
              ابعتلنا على واتساب
            </a>
          </div>
        </section>


        <Hero />
        <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">الأجهزة المتاحة حالياً</h2>
              <p className="text-sm text-slate-300">
                تصفح الأجهزة المتوفرة لدينا بالمواصفات والأسعار — {SHOP_INFO.address}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <a
                href={`tel:${SHOP_INFO.phones[0]}`}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-3.5 py-2 rounded-xl transition"
              >
                اتصل بنا: {SHOP_INFO.phones[0]}
              </a>
              <a
                href={`tel:${SHOP_INFO.phones[1]}`}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-3.5 py-2 rounded-xl transition"
              >
                {SHOP_INFO.phones[1]}
              </a>
            </div>
          </div>

          {focusedDeviceNotAvailable && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-xl text-sm flex flex-wrap items-center justify-between gap-2">
              <span>الجهاز المطلوب من الرابط غير متاح حالياً أو تم بيعه. تصفح باقي الأجهزة المتاحة:</span>
              <button
                onClick={() => {
                  setFocusedDeviceId("");
                  window.history.replaceState({}, "", window.location.pathname);
                }}
                className="text-xs underline font-semibold text-amber-300"
              >
                عرض الكل
              </button>
            </div>
          )}

          {/* البحث وفلترة النوع للعملاء */}
          <div className="space-y-3">
            <div className="relative">
              <span className="text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2">
                <IconSearch className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="ابحث عن جهاز أو مواصفات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-11 pl-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {["all", ...DEVICE_TYPES].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition ${
                    typeFilter === type
                      ? "bg-cyan-600 border-cyan-500 text-white"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {type === "all" ? "كل الأنواع" : type}
                </button>
              ))}
            </div>
          </div>

          {dataLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm">جاري تحميل الأجهزة المتاحة...</div>
          ) : customerDevices.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl py-12 text-center text-slate-400 text-sm">
              لا توجد أجهزة متاحة مطابقة للبحث حالياً.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customerDevices.map((item) => {
                const displayPrice = Number(item.expectedSellPrice) || 0;
                const isFocused = item.id === focusedDeviceId;
                const waText = encodeURIComponent(
                  `مرحباً ${SHOP_INFO.name}، كنت أستفسر عن جهاز: ${item.deviceName}${item.specs ? ` (${item.specs})` : ""}${displayPrice > 0 ? ` بسعر ${displayPrice.toLocaleString()} ج.م` : " وعايز أعرف السعر"}`
                );
                return (
                  <div
                    key={item.id}
                    className={`bg-slate-900 rounded-xl p-5 flex flex-col justify-between gap-4 transition border ${
                      isFocused
                        ? "border-cyan-400 ring-2 ring-cyan-500/30"
                        : "border-slate-800 hover:border-cyan-500/40"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block text-[11px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md mb-1">
                            {item.deviceType || "موبايل"}
                          </span>
                          <h3 className="text-lg font-bold text-white">{item.deviceName}</h3>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          متاح
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">
                        {item.specs || "متوفر بالفرع"}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] text-slate-500">السعر</div>
                        <div className="text-2xl font-bold text-white">
                          {displayPrice > 0 ? `${displayPrice.toLocaleString()} ج.م` : "تواصل للسعر"}
                        </div>
                      </div>

                      <a
                        href={`https://wa.me/${SHOP_INFO.whatsapp}?text=${waText}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold transition"
                      >
                        تواصل واتساب
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Services />
        </main>

        {/* نافذة تسجيل الدخول */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white">تسجيل دخول الموظفين / الإدارة</h2>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <IconClose className="w-5 h-5" />
                </button>
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
        )}
      </div>
    );
  }

  // ==========================================
  // 2. واجهة الموظفين (سيلز) والإدارة
  // ==========================================
  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-2.5 rounded-xl text-cyan-400">
              <IconPhone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide text-white">{SHOP_INFO.name}</h1>
              <p className="text-xs text-slate-400">حسابات الأجهزة • {SHOP_INFO.address}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${
                isAdmin
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                  : "bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              <IconShield className="w-4 h-4" />
              <span>{isAdmin ? "مدير النظام" : "موظف مبيعات"}</span>
            </div>

            {isAdmin && (
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  onClick={() => setActiveTab("devices")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    activeTab === "devices" ? "bg-cyan-600 text-white" : "text-slate-300 hover:text-white"
                  }`}
                >
                  الأجهزة
                </button>
                <button
                  onClick={() => setActiveTab("audit")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    activeTab === "audit" ? "bg-amber-600 text-white" : "text-slate-300 hover:text-white"
                  }`}
                >
                  سجل الرقابة ({auditLogs.length})
                </button>
              </div>
            )}

            {isAdmin && devices.length === 0 && (
              <button
                onClick={handleSyncGoogleSheetData}
                disabled={importing}
                className="flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition"
              >
                <IconDatabase className="w-4 h-4" />
                <span>{importing ? "جاري الرفع..." : "استيراد داتا الشيت (20 جهاز)"}</span>
              </button>
            )}

            <button
              onClick={handleCSVExport}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition"
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
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition"
            >
              <IconUpload className="w-4 h-4" />
              <span>استيراد CSV</span>
            </button>

            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition"
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

        {/* ملخص الحركة والمبيعات */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400 mb-1.5">إجمالي المبيعات</div>
            <p className="text-2xl font-bold text-emerald-400">
              {stats.totalRevenue.toLocaleString()} ج.م
            </p>
            <p className="text-xs text-slate-500 mt-1">قيمة الأجهزة المباعة فعلياً</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400 mb-1.5">عدد الأجهزة المباعة</div>
            <p className="text-2xl font-bold text-white">{stats.soldCount} جهاز</p>
            <p className="text-xs text-slate-500 mt-1">من إجمالي {stats.totalDevices} مسجل</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400 mb-1.5">عدد الأجهزة الحالية بالمخزن</div>
            <p className="text-2xl font-bold text-cyan-400">{stats.availableCount} جهاز</p>
            <p className="text-xs text-slate-500 mt-1">متاح للبيع</p>
          </div>
        </div>

        {/* توزيع الأرباح + متابعة صندوق رأس المال (للمدير فقط) */}
        {isAdmin ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h2 className="text-sm font-bold text-amber-300">توزيع صافي أرباح المحل</h2>
                <span className="text-xs text-slate-400">نسبة 40% / 60%</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1">إجمالي الصافي</div>
                  <div className="text-lg font-bold text-white">
                    {stats.totalProfit.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-cyan-500/20 p-3 rounded-xl">
                  <div className="text-xs text-cyan-400 mb-1">نصيب عبدو (40%)</div>
                  <div className="text-lg font-bold text-cyan-300">
                    {stats.abdoShare.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-emerald-500/20 p-3 rounded-xl">
                  <div className="text-xs text-emerald-400 mb-1">نصيب الإدارة (60%)</div>
                  <div className="text-lg font-bold text-emerald-300">
                    {stats.adminShare.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-purple-500/30 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h2 className="text-sm font-bold text-purple-300">متابعة صندوق رأس المال</h2>
                {!isEditingCapital ? (
                  <button
                    onClick={() => setIsEditingCapital(true)}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    تعديل رأس المال الأصلي
                  </button>
                ) : (
                  <form onSubmit={handleSaveCapital} className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={capitalInput}
                      onChange={(e) => setCapitalInput(e.target.value)}
                      className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                    />
                    <button type="submit" className="bg-purple-600 text-white text-xs px-2 py-1 rounded-lg">
                      حفظ
                    </button>
                  </form>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1">رأس المال الأصلي</div>
                  <div className="text-lg font-bold text-white">
                    {originalCapital.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                  <div className="text-xs text-amber-400 mb-1">قيمة البضاعة (شراء)</div>
                  <div className="text-lg font-bold text-amber-300">
                    {stats.inventoryCost.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-purple-500/20 p-3 rounded-xl">
                  <div className="text-xs text-purple-300 mb-1">الكاش المتبقي</div>
                  <div className="text-lg font-bold text-purple-300">
                    {stats.remainingCapitalCash.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    بالأرباح: {stats.totalCashInHand.toLocaleString()} ج.م
                  </div>
                </div>
              </div>
            </div>

            {OTHER_ACCOUNTS.map((acc) => {
              const oa = stats.otherByAccount[acc] || { soldCount: 0, availableCount: 0, due: 0, profit: 0, stockCost: 0 };
              const labels = OTHER_ACCOUNT_LABELS[acc] || { due: `مستحق لـ${acc}`, cost: `بتكلفة ${acc}` };
              return (
            <div key={acc} className="bg-slate-900 border border-amber-500/30 p-5 rounded-2xl space-y-3">
              <div className="border-b border-slate-800 pb-2.5">
                <h2 className="text-sm font-bold text-amber-300">حساب {acc} (منفصل عن رأس المال والأرباح)</h2>
                <p className="text-[11px] text-slate-500 mt-1">أجهزة حساب {acc} مش داخلة في رأس المال ولا في توزيع 40/60.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1">متاح</div>
                  <div className="text-lg font-bold text-white">{oa.availableCount} جهاز</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{labels.cost}: {oa.stockCost.toLocaleString()} ج.م</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1">اتباع</div>
                  <div className="text-lg font-bold text-white">{oa.soldCount} جهاز</div>
                </div>
                <div className="bg-slate-950/70 border border-amber-500/20 p-3 rounded-xl">
                  <div className="text-xs text-amber-400 mb-1">{labels.due}</div>
                  <div className="text-lg font-bold text-amber-300">{oa.due.toLocaleString()} <span className="text-xs font-normal">ج.م</span></div>
                </div>
                <div className="bg-slate-950/70 border border-emerald-500/20 p-3 rounded-xl">
                  <div className="text-xs text-emerald-400 mb-1">ربح الزيادة</div>
                  <div className="text-lg font-bold text-emerald-300">{oa.profit.toLocaleString()} <span className="text-xs font-normal">ج.م</span></div>
                </div>
              </div>
            </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-center text-slate-500 text-sm gap-2">
            <IconLock className="w-4 h-4" />
            <span>بيانات رأس المال وتوزيع الأرباح محجوبة لحساب المبيعات</span>
          </div>
        )}

        {/* تبويب سجل الرقابة للمدير */}
        {isAdmin && activeTab === "audit" ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-amber-300">سجل رقابة حركات الموظفين والإدارة</h2>
              <span className="text-xs text-slate-400">آخر {auditLogs.length} حركة</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-medium">المستخدم</th>
                    <th className="py-3 px-4 font-medium">الحركة</th>
                    <th className="py-3 px-4 font-medium">الجهاز</th>
                    <th className="py-3 px-4 font-medium">التفاصيل</th>
                    <th className="py-3 px-4 font-medium">الوقت والتاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500">
                        لا توجد حركات مسجلة في سجل الرقابة حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono text-xs text-cyan-300">{log.actorEmail}</td>
                        <td className="py-3 px-4 font-semibold text-white">{log.actionType}</td>
                        <td className="py-3 px-4 text-slate-200">{log.deviceName}</td>
                        <td className="py-3 px-4 text-xs text-slate-400">{log.details || "—"}</td>
                        <td className="py-3 px-4 text-xs text-slate-400">{formatAuditDate(log.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {/* شريط البحث والفلترة (الحالة + النوع) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2">
                    <IconSearch className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="ابحث باسم الجهاز، المواصفات، السيريال، أو الملاحظات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-11 pl-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {["all", "متاح", "مباع", "صيانة"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition ${
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

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 ml-1">النوع:</span>
                {["all", ...DEVICE_TYPES].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                      typeFilter === type
                        ? "bg-slate-700 border-cyan-500/60 text-cyan-300"
                        : "bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {type === "all" ? "الكل" : type}
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
                        <th className="py-3.5 px-3 font-medium w-12 text-center">م</th>
                        <th className="py-3.5 px-4 font-medium">الجهاز والنوع</th>
                        {isAdmin && <th className="py-3.5 px-4 font-medium">سعر الشراء</th>}
                        <th className="py-3.5 px-4 font-medium">سعر البيع المتوقع</th>
                        <th className="py-3.5 px-4 font-medium">سعر البيع</th>
                        <th className="py-3.5 px-4 font-medium">حالة الجهاز (مواصفات)</th>
                        {isAdmin && <th className="py-3.5 px-4 font-medium">صافي ربح الجهاز</th>}
                        <th className="py-3.5 px-4 font-medium">الحالة</th>
                        <th className="py-3.5 px-4 font-medium">ملاحظات</th>
                        <th className="py-3.5 px-4 font-medium text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {filteredDevices.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin ? 10 : 8} className="py-12 text-center text-slate-500">
                            لا توجد أجهزة مطابقة حالياً.
                          </td>
                        </tr>
                      ) : (
                        filteredDevices.map((item, idx) => {
                          const profit = (Number(item.sellPrice) || 0) - (Number(item.buyPrice) || 0);
                          return (
                            <tr key={item.id} className="hover:bg-slate-800/40 transition">
                              <td className="py-3.5 px-3 text-center text-slate-500 font-mono text-xs">
                                {idx + 1}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{item.deviceName}</span>
                                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    {item.deviceType || "موبايل"}
                                  </span>
                                  {isAdmin && isOtherAccount(item) && (
                                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">{item.clientOrSupplier}</span>
                                  )}
                                </div>
                                {item.imei && (
                                  <div className="text-[11px] font-mono text-slate-500">IMEI: {item.imei}</div>
                                )}
                              </td>
                              {isAdmin && (
                                <td className="py-3.5 px-4 text-slate-300">
                                  {Number(item.buyPrice || 0).toLocaleString()} ج.م
                                </td>
                              )}
                              <td className="py-3.5 px-4 text-slate-400">
                                {Number(item.expectedSellPrice) > 0
                                  ? `${Number(item.expectedSellPrice).toLocaleString()} ج.م`
                                  : "—"}
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-white">
                                {Number(item.sellPrice) > 0
                                  ? `${Number(item.sellPrice).toLocaleString()} ج.م`
                                  : "—"}
                              </td>
                              <td className="py-3.5 px-4 text-slate-300 text-xs">
                                {item.specs || item.storage || "—"}
                              </td>
                              {isAdmin && (
                                <td
                                  className={`py-3.5 px-4 font-semibold ${
                                    item.status === "مباع"
                                      ? profit >= 0
                                        ? "text-emerald-400"
                                        : "text-red-400"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {item.status === "مباع" ? `${profit.toLocaleString()} ج.م` : "—"}
                                </td>
                              )}
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
                              <td className="py-3.5 px-4 text-slate-400 text-xs">
                                {item.notes || "—"}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  {item.status === "متاح" && (
                                    <>
                                      <button
                                        onClick={() => openQuickSellModal(item)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                                      >
                                        <IconTag className="w-3.5 h-3.5" />
                                        <span>بيع</span>
                                      </button>
                                      <button
                                        onClick={() => handleCopyDeviceLink(item.id)}
                                        title="نسخ رابط الجهاز للعميل"
                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs border border-slate-700 transition"
                                      >
                                        <IconLink className="w-3.5 h-3.5" />
                                        <span>{copiedId === item.id ? "تم النسخ" : "رابط"}</span>
                                      </button>
                                    </>
                                  )}

                                  {item.status === "مباع" && (
                                    <button
                                      onClick={() => setInvoiceItem(item)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition"
                                    >
                                      <IconPrint className="w-3.5 h-3.5" />
                                      <span>فاتورة</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => openEditModal(item)}
                                    title="تعديل"
                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                  >
                                    <IconEdit className="w-4 h-4" />
                                  </button>

                                  {isAdmin && (
                                    <button
                                      onClick={() => handleDelete(item)}
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
          </>
        )}
      </main>

      {/* نافذة «بيع» السريعة */}
      {sellingItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">تسجيل بيع جهاز</h2>
                <p className="text-xs text-emerald-400">
                  {sellingItem.deviceName} • {sellingItem.deviceType || "موبايل"}
                </p>
              </div>
              <button
                onClick={() => setSellingItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmQuickSell} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">سعر البيع (ج.م) *</label>
                <input
                  type="number"
                  required
                  autoFocus
                  placeholder="اكتب سعر البيع"
                  value={quickSellPrice}
                  onChange={(e) => setQuickSellPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">ملحقات / ضمان (للفاتورة)</label>
                <input
                  type="text"
                  placeholder="مثال: كرتونة / شاحن / ضمان 14 يوم"
                  value={quickSellAccessories}
                  onChange={(e) => setQuickSellAccessories(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">ملاحظات البيع (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: كاش / اسم العميل..."
                  value={quickSellNotes}
                  onChange={(e) => setQuickSellNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSellingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSellingSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
                >
                  {isSellingSaving ? "جاري الحفظ..." : "تأكيد البيع"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة إضافة / تعديل جهاز */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[92vh] overflow-y-auto">
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
                  <label className="block text-xs text-slate-400 mb-1">اسم الجهاز *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 13 pro max"
                    value={formData.deviceName}
                    onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">نوع الجهاز *</label>
                  <select
                    required
                    value={formData.deviceType}
                    onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {DEVICE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">حالة الجهاز (مواصفات) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 256GB بطارية 89% كسر زيرو"
                  value={formData.specs}
                  onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {isAdmin && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">سعر الشراء (ج.م) *</label>
                    <input
                      type="number"
                      required
                      value={formData.buyPrice}
                      onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">سعر البيع المتوقع *</label>
                  <input
                    type="number"
                    required
                    value={formData.expectedSellPrice}
                    onChange={(e) => setFormData({ ...formData, expectedSellPrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div className={isAdmin ? "" : "sm:col-span-2"}>
                  <label className="block text-xs text-slate-400 mb-1">سعر البيع الفعلي</label>
                  <input
                    type="number"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">IMEI / السيريال *</label>
                  <input
                    type="text"
                    required
                    placeholder="السيريال أو IMEI"
                    value={formData.imei}
                    onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                    className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-sm text-white font-mono ${
                      duplicateImeiDevice ? "border-red-500" : "border-slate-800"
                    }`}
                  />
                  {duplicateImeiDevice && (
                    <p className="text-[11px] text-red-400 mt-1">
                      تنبيه: هذا السيريال/IMEI مسجل بالفعل على "{duplicateImeiDevice.deviceName}"!
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">حالة البيع *</label>
                  <select
                    required
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

              {isAdmin && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">حساب الجهاز (داخلي، مش بيظهر للعملاء)</label>
                  <select
                    value={OTHER_ACCOUNTS.includes(formData.clientOrSupplier) ? formData.clientOrSupplier : "عبدو"}
                    onChange={(e) => setFormData({ ...formData, clientOrSupplier: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="عبدو">المحل (رأس المال)</option>
                    <option value="بيكا">حساب بيكا (منفصل)</option>
                    <option value="الهواري">حساب الهواري (منفصل)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">ملحقات / ضمان (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: كرتونة / شاحن / ضمان 14 يوم"
                  value={formData.accessories}
                  onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">ملاحظات (اختياري)</label>
                <input
                  type="text"
                  placeholder="أي تفاصيل إضافية..."
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

      {/* نافذة فاتورة البيع وشروط الضمان (14 يوم وعدم المسؤولية عن الضرائب) */}
      {invoiceItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-xl p-6 md:p-8 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-2xl font-extrabold tracking-wide text-slate-950">{SHOP_INFO.name}</h2>
                <p className="text-xs text-slate-600 mt-1">{SHOP_INFO.address}</p>
                <p className="text-xs text-slate-600 mt-0.5" dir="ltr">
                  {SHOP_INFO.phones.join("  •  ")}
                </p>
              </div>
              <div className="text-left">
                <span className="inline-block bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-lg">
                  فاتورة بيع
                </span>
                <p className="text-xs text-slate-500 mt-1.5">
                  التاريخ: {new Date().toLocaleDateString("ar-EG")}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">الجهاز:</span>
                <span className="font-bold text-slate-900">
                  {invoiceItem.deviceName} ({invoiceItem.deviceType || "موبايل"})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المواصفات:</span>
                <span className="font-medium text-slate-800">{invoiceItem.specs || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">السيريال / IMEI:</span>
                <span className="font-mono text-xs text-slate-800">{invoiceItem.imei || "—"}</span>
              </div>
              {invoiceItem.accessories && (
                <div className="flex justify-between">
                  <span className="text-slate-500">الملحقات:</span>
                  <span className="font-medium text-slate-800">{invoiceItem.accessories}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2.5 text-base">
                <span className="font-bold text-slate-900">الإجمالي المطلوب:</span>
                <span className="font-extrabold text-slate-950">
                  {Number(invoiceItem.sellPrice || 0).toLocaleString()} ج.م
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900">شروط الضمان وإخلاء المسؤولية:</h3>
              <ul className="list-disc pr-4 space-y-1 text-xs text-slate-700 leading-relaxed">
                {INVOICE_TERMS.map((term, i) => (
                  <li key={i}>{term}</li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2 gap-2">
              <button
                onClick={() => setInvoiceItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-semibold"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold"
              >
                <IconPrint className="w-4 h-4" />
                <span>طباعة الفاتورة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
    }
