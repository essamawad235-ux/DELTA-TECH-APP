import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';
const appId = "delta-tech-app";
import { 
  Smartphone, 
  Plus, 
  LogOut, 
  DollarSign, 
  Package, 
  TrendingUp, 
  Wallet, 
  Trash2, 
  Edit2,
  Shield,
  User,
  CheckCircle,
  X
} from 'lucide-react';

// ==========================================
// 1. إعدادات قاعدة البيانات (Firebase Config)
// ==========================================
// استبدل القيم اللي بين الأقواس ببيانات مشروعك من Firebase لاحقاً
const fallbackConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const firebaseConfig = {
  apiKey: "AIzaSyDMTlRJIU7n9FS4RwJ8anvXnHG2CEjSMBE",
  authDomain: "delta-technoloogy.firebaseapp.com",
  projectId: "delta-technoloogy",
  storageBucket: "delta-technoloogy.firebasestorage.app",
  messagingSenderId: "884629212277",
  appId: "1:884629212277:web:ab56e6c828804666947c3c",
  measurementId: "G-YBZGK84RPS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'employee'
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({ name: '', buyPrice: '', sellPrice: '' });
  const [errorMsg, setErrorMsg] = useState('');

  // رأس المال الأساسي للمحل (يمكن تعديله)
  const INITIAL_CAPITAL = 33700; 

  // ==========================================
  // 2. المصادقة وجلب البيانات
  // ==========================================
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const devicesRef = collection(db, 'artifacts', appId, 'public', 'data', 'devices');
    
    const unsubscribe = onSnapshot(devicesRef, (snapshot) => {
      const devicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // ترتيب الأجهزة: الأحدث أولاً
      devicesData.sort((a, b) => b.timestamp - a.timestamp);
      setDevices(devicesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching devices:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // ==========================================
  // 3. العمليات الحسابية الآلية (Finances Logic)
  // ==========================================
  const finances = useMemo(() => {
    let goodsValue = 0;
    let totalProfit = 0;

    devices.forEach(device => {
      const buy = Number(device.buyPrice) || 0;
      const sell = Number(device.sellPrice) || 0;

      if (device.status === 'in_stock') {
        goodsValue += buy;
      } else if (device.status === 'sold') {
        totalProfit += (sell - buy);
      }
    });

    // الكاش المتبقي = رأس المال الأساسي - البضاعة الموجودة + الأرباح المحققة
    const currentCash = INITIAL_CAPITAL - goodsValue + totalProfit;
    // إجمالي رأس المال الحالي = الكاش + البضاعة
    const totalCapital = currentCash + goodsValue;

    return {
      capital: totalCapital,
      cash: currentCash,
      goods: goodsValue,
      profit: totalProfit
    };
  }, [devices]);

  // ==========================================
  // 4. الدوال والأحداث (Actions)
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!formData.name || !formData.sellPrice) {
      setErrorMsg('برجاء إدخال اسم الجهاز وسعر البيع');
      return;
    }
    if (role === 'admin' && formData.buyPrice === '') {
      setErrorMsg('برجاء إدخال سعر الشراء للمدير');
      return;
    }

    try {
      const devicesRef = collection(db, 'artifacts', appId, 'public', 'data', 'devices');
      const deviceData = {
        name: formData.name,
        buyPrice: role === 'admin' ? Number(formData.buyPrice) : 0,
        sellPrice: Number(formData.sellPrice),
        status: editingDevice ? editingDevice.status : 'in_stock', // in_stock or sold
        timestamp: editingDevice ? editingDevice.timestamp : Date.now(),
        addedBy: role
      };

      if (editingDevice) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'devices', editingDevice.id);
        await updateDoc(docRef, deviceData);
      } else {
        await addDoc(devicesRef, deviceData);
      }
      closeModal();
    } catch (error) {
      console.error("Error saving device:", error);
      setErrorMsg('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id) => {
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'devices', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting device:", error);
    }
  };

  const markAsSold = async (id) => {
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'devices', id);
      await updateDoc(docRef, { status: 'sold', soldAt: Date.now() });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const openModal = (device = null) => {
    if (device) {
      setEditingDevice(device);
      setFormData({ name: device.name, buyPrice: device.buyPrice, sellPrice: device.sellPrice });
    } else {
      setEditingDevice(null);
      setFormData({ name: '', buyPrice: '', sellPrice: '' });
    }
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDevice(null);
    setFormData({ name: '', buyPrice: '', sellPrice: '' });
  };

  // ==========================================
  // 5. واجهة المستخدم (UI Components)
  // ==========================================
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500"></div>
        <p className="text-gray-400 font-bold">جاري تحميل البيانات...</p>
      </div>
    );
  }

  // شاشة تسجيل الدخول
  if (!role) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-700 text-center relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          
          <div className="flex justify-center mb-6 relative z-10">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg">
              <TrendingUp size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-wide">
            DELTA TECHNOLOGY
          </h1>
          <p className="text-gray-400 mb-8 font-medium">نظام إدارة حسابات وجرد الأجهزة</p>
          
          <div className="space-y-4 relative z-10">
            <button 
              onClick={() => setRole('admin')}
              className="w-full flex items-center justify-center space-x-3 space-x-reverse bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl transition-all shadow-md shadow-indigo-900/50 font-bold text-lg"
            >
              <Shield size={24} />
              <span>دخول كمدير (Admin)</span>
            </button>
            <button 
              onClick={() => setRole('employee')}
              className="w-full flex items-center justify-center space-x-3 space-x-reverse bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-xl transition-all font-bold text-lg"
            >
              <User size={24} />
              <span>دخول كموظف (Employee)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // اللوحة الرئيسية (Dashboard)
  return (
    <div dir="rtl" className="min-h-screen bg-gray-900 text-gray-200 font-sans pb-20 md:pb-8">
      
      {/* Navbar */}
      <nav className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
            <TrendingUp size={24} className="text-white" />
          </div>
          <span className="text-xl font-extrabold text-white tracking-wider">DELTA TECH</span>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex flex-col text-left mr-4">
            <span className="text-xs text-gray-400">حساب</span>
            <span className="text-sm font-bold text-indigo-400">{role === 'admin' ? 'المدير' : 'الموظف'}</span>
          </div>
          <button 
            onClick={() => setRole(null)}
            className="bg-gray-700 p-2 rounded-lg text-gray-300 hover:text-white hover:bg-red-500/80 transition shadow-sm"
            title="تسجيل الخروج"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* ملخص الحسابات (يظهر للمدير فقط) */}
        {role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center space-x-4 space-x-reverse relative z-10">
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
                  <Wallet size={32} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1 font-medium">إجمالي رأس المال</p>
                  <h3 className="text-2xl font-bold text-white">{finances.capital.toLocaleString()} ج</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center space-x-4 space-x-reverse relative z-10">
                <div className="p-3 bg-green-500/20 text-green-400 rounded-xl">
                  <DollarSign size={32} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1 font-medium">الكاش المتاح</p>
                  <h3 className="text-2xl font-bold text-white">{finances.cash.toLocaleString()} ج</h3>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center space-x-4 space-x-reverse relative z-10">
                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
                  <Package size={32} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1 font-medium">قيمة البضاعة الحالية</p>
                  <h3 className="text-2xl font-bold text-white">{finances.goods.toLocaleString()} ج</h3>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center space-x-4 space-x-reverse relative z-10">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <TrendingUp size={32} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1 font-medium">صافي الأرباح</p>
                  <h3 className="text-2xl font-bold text-emerald-400">{finances.profit.toLocaleString()} ج</h3>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* جدول الأجهزة */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-800/50">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Smartphone className="ml-3 text-indigo-400" size={24} />
              المخزن وجرد الأجهزة
            </h2>
            <button 
              onClick={() => openModal()}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl flex items-center justify-center transition shadow-lg font-bold"
            >
              <Plus size={20} className="ml-2" />
              إضافة جهاز جديد
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-900/80 text-gray-300 border-b border-gray-700 text-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold">اسم الجهاز</th>
                  <th className="px-6 py-4 font-semibold">الحالة</th>
                  {role === 'admin' && <th className="px-6 py-4 font-semibold">سعر الشراء</th>}
                  <th className="px-6 py-4 font-semibold">سعر البيع</th>
                  {role === 'admin' && <th className="px-6 py-4 font-semibold">الربح</th>}
                  <th className="px-6 py-4 font-semibold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={role === 'admin' ? 6 : 4} className="text-center py-12 text-gray-500">
                      <Package size={48} className="mx-auto mb-3 opacity-20" />
                      لا توجد أجهزة في الجرد حالياً. اضغط على إضافة للبدء.
                    </td>
                  </tr>
                ) : (
                  devices.map((device) => {
                    const buy = Number(device.buyPrice) || 0;
                    const sell = Number(device.sellPrice) || 0;
                    const profit = sell - buy;
                    const isSold = device.status === 'sold';

                    return (
                      <tr key={device.id} className={`transition ${isSold ? 'bg-gray-800/30 opacity-75' : 'hover:bg-gray-700/40'}`}>
                        <td className="px-6 py-4 font-bold text-white">{device.name}</td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${isSold ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                            {isSold ? 'تم البيع' : 'بالمحل'}
                          </span>
                        </td>
                        
                        {role === 'admin' && (
                          <td className="px-6 py-4 text-gray-300 font-medium">
                            {buy > 0 ? `${buy.toLocaleString()} ج` : <span className="text-red-400/80 text-xs">غير مسجل</span>}
                          </td>
                        )}
                        
                        <td className="px-6 py-4 text-indigo-300 font-bold">{sell.toLocaleString()} ج</td>
                        
                        {role === 'admin' && (
                          <td className="px-6 py-4">
                            {buy > 0 ? (
                              <span className={`px-2 py-1 rounded-md text-sm font-bold ${profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {profit > 0 ? '+' : ''}{profit.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                        )}

                        <td className="px-6 py-4 flex justify-center space-x-2 space-x-reverse">
                          {!isSold && (
                            <button 
                              onClick={() => markAsSold(device.id)}
                              className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition"
                              title="تحديد كـ مباع"
                            >
                              <CheckCircle size={20} />
                            </button>
                          )}
                          <button 
                            onClick={() => openModal(device)}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition"
                            title="تعديل"
                          >
                            <Edit2 size={20} />
                          </button>
                          {role === 'admin' && (
                            <button 
                              onClick={() => handleDelete(device.id)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition"
                              title="حذف"
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* النافذة المنبثقة (Modal) للإضافة والتعديل */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-gray-800 rounded-3xl w-full max-w-md border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" dir="rtl">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/80">
              <h3 className="text-xl font-bold text-white flex items-center">
                {editingDevice ? <Edit2 className="ml-2 text-indigo-400" size={20}/> : <Plus className="ml-2 text-indigo-400" size={20}/>}
                {editingDevice ? 'تعديل بيانات الجهاز' : 'إضافة جهاز جديد'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-red-400 transition bg-gray-700/50 hover:bg-gray-700 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">اسم الجهاز (النوع والموديل)</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium"
                  placeholder="مثال: iPhone 13 Pro Max"
                />
              </div>

              {role === 'admin' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">سعر الشراء (التكلفة بالجنيه)</label>
                  <input 
                    type="number" 
                    value={formData.buyPrice}
                    onChange={(e) => setFormData({...formData, buyPrice: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium"
                    placeholder="0"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">سعر البيع (للعميل بالجنيه)</label>
                <input 
                  type="number" 
                  value={formData.sellPrice}
                  onChange={(e) => setFormData({...formData, sellPrice: e.target.value})}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium"
                  placeholder="0"
                />
              </div>

              <div className="pt-4 flex space-x-3 space-x-reverse">
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3.5 rounded-xl font-bold transition shadow-lg"
                >
                  {editingDevice ? 'حفظ التعديلات' : 'إضافة للجرد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
