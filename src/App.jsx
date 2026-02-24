import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Plus, Edit2, Trash2, Shield, Download, CheckCircle, XCircle, GraduationCap,
  BookOpen, PieChart, Camera, Lock, ArrowRight, RotateCcw, Calendar, Clock, Check, X,
  Filter, BarChart3, ArrowLeftRight, Accessibility, School, StickyNote, MessageSquare, 
  FileText, ZoomIn, ZoomOut, Sparkles, QrCode, TrendingUp, Save, Search, ChevronDown
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import * as XLSX from 'xlsx';

// --- Firebase Configuration ---
let app, auth, db, appId;
try {
  const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{"apiKey":"dummy"}');
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
} catch (e) {
  console.error("Firebase Config Error:", e);
}

// --- Constants ---
const KEMAHIRAN_BM = [
  "KP 1: Huruf Kecil", "KP 2: Huruf Besar", "KP 3: Huruf Vokal", "KP 4: Suku Kata KV",
  "KP 5: Perkataan KV + KV", "KP 6: Perkataan V + KV", "KP 7: Perkataan KV + KV + KV", "KP 8: Perkataan KVK",
  "KP 9: Suku Kata KVK", "KP 10: Perkataan V + KVK", "KP 11: Perkataan KV + KVK", "KP 12: Perkataan KVK + KV",
  "KP 13: Perkataan KVK + KVK", "KP 14: Perkataan KV + KV + KVK", "KP 15: Perkataan KV + KVK + KV", "KP 16: Perkataan KVK + KV + KV",
  "KP 17: Perkataan KV + KVK + KVK", "KP 18: Perkataan KVK + KV + KVK", "KP 19: Perkataan KVK + KVK + KV", "KP 20: Perkataan KVK + KVK + KVK",
  "KP 21: Perkataan KVKK", "KP 22: Perkataan V + KVKK", "KP 23: Perkataan K + VKK", "KP 24: Perkataan KV + KVKK",
  "KP 25: Perkataan KVK + KVKK", "KP 26: Perkataan KVKK + KV", "KP 27: Perkataan KVKK + KVK", "KP 28: Perkataan KVKK + KVKK",
  "KP 29: Perkataan KV + KV + KVKK", "KP 30: Perkataan KV + KVK + KVKK", "KP 31: Perkataan KVK + KV + KVKK", "KP 32: Bacaan dan Pemahaman"
];
const KEMAHIRAN_MATH = [
  "KP 1: Pra Nombor", "KP 2: Konsep Nombor", "KP 3: Nombor Bulat", "KP 4: Tambah Lingkungan 10", "KP 5: Tolak Lingkungan 10",
  "KP 6: Tambah Lingkungan 18", "KP 7: Tolak Lingkungan 18", "KP 8: Tambah Lingkungan 100", "KP 9: Tolak Lingkungan 100",
  "KP 10: Darab", "KP 11: Bahagi", "KP 12: Wang & Masa"
];
const subjects = ['Pemulihan BM', 'Pemulihan Matematik', 'Pemulihan BM dan Matematik'];

// --- Helpers ---
const calculateSchoolYearFromIC = (ic) => {
  if (!ic) return null;
  const icStr = String(ic).replace(/\D/g, ''); 
  if (icStr.length < 2) return null;
  const yP = parseInt(icStr.substring(0, 2));
  if (isNaN(yP)) return null;
  return (new Date().getFullYear()) - (2000 + yP) - 6;
};
const getYearFromClassString = (c) => c ? parseInt(String(c).split(' ')[0]) || null : null;
const getStudentCurrentYear = (s) => calculateSchoolYearFromIC(s.ic) || getYearFromClassString(s.className) || 0;
const calcLulusYear = (c, d) => (getYearFromClassString(c) || 99) + (new Date().getFullYear() - (d ? new Date(d).getFullYear() : new Date().getFullYear()));
const getSubjectBadgeColor = (subject) => {
  if (subject === 'Pemulihan BM') return 'bg-blue-600';
  if (subject === 'Pemulihan Matematik') return 'bg-orange-500';
  return 'bg-purple-600';
};
const calcStats = (r) => { const p = r?.filter(x=>x.status==='present').length||0; const t = r?.length||0; return { percent: t?Math.round((p/t)*100):0, present: p, total: t }; };
const formatDate = (t) => t ? new Date(t.toDate ? t.toDate() : t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

// --- UI Components ---
const RetroProgressBar = ({ progress }) => (
  <div className="w-full bg-gray-200 rounded-md p-1 border border-gray-400 shadow-inner">
    <div className="relative w-full h-6 bg-white border border-gray-300 rounded-sm overflow-hidden">
      <div className="h-full bg-gradient-to-b from-green-400 via-green-500 to-green-600 relative overflow-hidden transition-all duration-500 ease-out flex items-center" style={{ width: `${progress}%` }}>
        <div className="absolute top-0 left-0 w-full h-full animate-progress-shine opacity-30 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12"></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-shadow-sm mix-blend-difference text-white">{Math.round(progress)}% Completed</div>
    </div>
    <style>{`@keyframes progress-shine { 0% { transform: translateX(-100%) skewX(-12deg); } 100% { transform: translateX(200%) skewX(-12deg); } } .animate-progress-shine { animation: progress-shine 2s linear infinite; }`}</style>
  </div>
);

const ImageAdjuster = ({ imageSrc, onSave, onCancel, title = "Adjust Photo" }) => {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDrag, setIsDrag] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null), imgRef = useRef(null), contRef = useRef(null);

  const down = (e) => { setIsDrag(true); setStart({ x: e.clientX - pos.x, y: e.clientY - pos.y }); };
  const move = (e) => { if (isDrag) setPos({ x: e.clientX - start.x, y: e.clientY - start.y }); };
  const up = () => setIsDrag(false);
  const tDown = (e) => { setIsDrag(true); setStart({ x: e.touches[0].clientX - pos.x, y: e.touches[0].clientY - pos.y }); };
  const tMove = (e) => { if (isDrag) setPos({ x: e.touches[0].clientX - start.x, y: e.touches[0].clientY - start.y }); };

  const save = () => {
    const canvas = canvasRef.current, ctx = canvas.getContext('2d'), img = imgRef.current;
    const size = 500, ratio = size / contRef.current.clientWidth;
    canvas.width = canvas.height = size;
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, (pos.x * ratio) + (size / 2) - ((img.width * scale * ratio) / 2), (pos.y * ratio) + (size / 2) - ((img.height * scale * ratio) / 2), img.width * scale * ratio, img.height * scale * ratio);
    onSave(canvas.toDataURL('image/jpeg', 0.8));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between"><h3 className="font-bold">{title}</h3><button onClick={onCancel}><X/></button></div>
        <div className="p-6 flex flex-col items-center gap-4">
          <div ref={contRef} className="w-64 h-64 bg-slate-100 rounded-xl overflow-hidden relative cursor-move touch-none border-2 shadow-inner" onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up} onTouchStart={tDown} onTouchMove={tMove} onTouchEnd={up}>
            <img ref={imgRef} src={imageSrc} className="absolute max-w-none origin-center pointer-events-none" style={{ transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${scale})`, left: '50%', top: '50%' }} />
          </div>
          <div className="w-full flex items-center gap-3"><ZoomOut size={16}/> <input type="range" min="0.1" max="3" step="0.05" value={scale} onChange={(e)=>setScale(parseFloat(e.target.value))} className="flex-1" /> <ZoomIn size={16}/></div>
        </div>
        <div className="p-4 border-t flex gap-3"><button onClick={onCancel} className="flex-1 py-2 bg-slate-100 font-bold rounded-xl">Cancel</button><button onClick={save} className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-xl">Save</button></div>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
};

const ImageViewer = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in" onClick={onClose}>
       <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2"><X size={32} /></button>
       <img src={src} className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
    </div>
  );
};

const Avatar = ({ name, color, photoUrl, size = "w-12 h-12", onClick }) => {
  const c = `${size} rounded-xl shadow-sm border-2 border-white ring-1 ring-gray-100 flex-shrink-0 ${onClick?'cursor-pointer hover:opacity-90':''}`;
  if (photoUrl) return <img src={photoUrl} alt={name} className={`${c} object-cover object-top bg-white`} onClick={onClick} />;
  return <div className={`${c} flex items-center justify-center text-white font-bold shadow-sm ${color}`}>{name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</div>;
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        <div className="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white z-10"><h3 className="font-bold text-lg">{title}</h3><button onClick={onClose}><XCircle/></button></div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function StudentDatabaseApp() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('user'); 
  const [currentSection, setCurrentSection] = useState('profile'); 
  
  const [filters, setFilters] = useState({ year: 'All', class: 'All', subject: 'All', statsYear: 'All', statsGender: 'All', statsSubject: 'All', search: '' });

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', program: 'pemulihan', className: '', subject: 'Pemulihan BM', ic: '', gender: '', mbkType: 'MBK', status: 'Active', photoUrl: '', remarks: '', docLink: '', isNewStudent: false, qrCodeUrl: '' });

  const [rawImageSrc, setRawImageSrc] = useState(null), [fullScreenImage, setFullScreenImage] = useState(null), [uploadType, setUploadType] = useState('profile');
  
  const [selProg, setSelProg] = useState(null), [progSub, setProgSub] = useState('BM'), [progData, setProgData] = useState({});
  const [delConf, setDelConf] = useState({ isOpen: false, id: null, name: '' });
  const [moveConf, setMoveConf] = useState({ isOpen: false, student: null, newStatus: '' }), [moveDate, setMoveDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAttOpen, setIsAttOpen] = useState(false), [selAtt, setSelAtt] = useState(null), [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [isNoteOpen, setIsNoteOpen] = useState(false), [selNote, setSelNote] = useState(null), [noteForm, setNoteForm] = useState({ id: null, text: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) setRole(u.email === "admin@pemulihan.com" ? 'admin' : 'user');
      else try { await signInAnonymously(auth); } catch(e) {}
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const unsubscribe = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'students')), (snapshot) => {
        setStudents(snapshot.docs.map(d => ({ id: d.id, attendanceRecords: [], notes: [], ...d.data() })));
        setLoading(false);
      }, (err) => { console.error(err); setLoading(false); }
    );
    return () => unsubscribe();
  }, [user]);

  // Handlers
  const updateFilter = (key, value) => setFilters(p => ({ ...p, [key]: value }));
  const handleTab = (id) => {
    setCurrentSection(id);
    if(id !== 'progress') { updateFilter('year', 'All'); updateFilter('class', 'All'); updateFilter('subject', 'All'); if (id === 'mbk') updateFilter('year', ''); }
    if (id !== 'progress') { setSelProg(null); updateFilter('search', ''); }
  };

  const handleRoleSwitch = async (t) => {
    if (t === 'admin') { if (role !== 'admin') setShowAdminLogin(true); } 
    else { if (role === 'admin') { try { await signOut(auth); setRole('user'); } catch(e){} } }
  };
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try { await signInWithEmailAndPassword(auth, "admin@pemulihan.com", adminPassword); setShowAdminLogin(false); setAdminPassword(''); setLoginError(''); } 
    catch (e) { setLoginError('Incorrect password.'); }
  };

  const handleImgUp = (e, t='profile') => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert("Max 5MB."); return; }
      const reader = new FileReader();
      reader.onload = (ev) => { setRawImageSrc(ev.target.result); setUploadType(t); };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCropSave = (b64) => {
    if (uploadType === 'profile') setFormData(p => ({ ...p, photoUrl: b64 }));
    else setFormData(p => ({ ...p, qrCodeUrl: b64 }));
    setRawImageSrc(null);
  };
  
  const handleSave = async (e) => {
    e.preventDefault(); if (!user || !db) return;
    if (!formData.gender) { alert("Select gender."); return; }
    try {
      const d = { name: formData.name, program: formData.program, gender: formData.gender, status: formData.status, photoUrl: formData.photoUrl || '', updatedAt: serverTimestamp(), ic: formData.ic || '', isNewStudent: formData.isNewStudent || false };
      if (formData.program === 'pemulihan') { d.className = formData.className; d.subject = formData.subject; } 
      else { d.mbkType = formData.mbkType; d.remarks = formData.remarks || ''; d.docLink = formData.docLink || ''; d.qrCodeUrl = formData.qrCodeUrl || ''; }
      if (editingId) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', editingId), d);
      else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { ...d, attendanceRecords: [], notes: [], color: ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'][Math.floor(Math.random() * 6)], createdAt: serverTimestamp() });
      setIsModalOpen(false); setEditingId(null);
    } catch (err) { console.error(err); }
  };

  const handleProgSave = async () => {
    if (!user || !selProg || !db) return;
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', selProg.id), { progress: progData }); alert("Saved!"); } 
    catch (err) { console.error(err); alert("Failed."); }
  };
  
  const toggleSkill = (i) => {
    const k = progSub === 'BM' ? 'bm' : 'math';
    const c = progData[k] || [];
    setProgData(p => ({ ...p, [k]: c.includes(i) ? c.filter(x => x !== i) : [...c, i] }));
  };

  const expXLSX = () => {
    if (!students.length) return;
    const wb = XLSX.utils.book_new();
    const f = (s) => ({ Name: s.name, Gender: s.gender, IC: s.ic||'', Class: s.className||'', Subject: s.subject||'', Program: s.program==='mbk'?(s.mbkType||'MBK'):'Pemulihan', Status: s.status, Remarks: s.remarks||'', DocLink: s.docLink||'' });
    const addS = (data, name) => { if(data.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), name); };
    addS(students.filter(s=>s.program==='pemulihan'&&s.status!=='Lulus'&&getStudentCurrentYear(s)<=3).map(f), "Profile");
    addS(students.filter(s=>s.program==='pemulihan'&&s.status!=='Lulus'&&getStudentCurrentYear(s)>=4&&getStudentCurrentYear(s)<=6).map(f), "PLaN");
    addS(students.filter(s=>s.program==='mbk').map(f), "MBK");
    addS(students.filter(s=>s.status==='Lulus').map(s=>({...f(s), GradDate: s.graduationDate||''})), "Lulus");
    XLSX.writeFile(wb, "Student_Database.xlsx");
  };

  const execDel = async () => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', delConf.id)); setDelConf({ isOpen: false, id: null, name: '' }); } catch (e) { console.error(e); }
  };
  
  const markAtt = async (status) => {
    try {
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', selAtt.id);
      const ex = selAtt.attendanceRecords?.find(r => r.date === attDate);
      if (ex) await updateDoc(ref, { attendanceRecords: arrayRemove(ex) });
      await updateDoc(ref, { attendanceRecords: arrayUnion({ date: attDate, status: status, timestamp: Date.now() }) });
    } catch(e) {}
  };

  const saveNote = async (e) => {
    e.preventDefault();
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', selNote.id);
    const n = noteForm.id ? selNote.notes.map(x=>x.id===noteForm.id?{...x, text: noteForm.text, date: noteForm.date}:x) : [...(selNote.notes||[]), { id: Date.now().toString(), text: noteForm.text, date: noteForm.date, timestamp: Date.now() }];
    try { await updateDoc(ref, { notes: n }); setNoteForm({ id: null, text: '', date: new Date().toISOString().split('T')[0] }); } catch(e){}
  };

  const execMove = async () => {
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', moveConf.student.id), { status: moveConf.newStatus, graduationDate: moveConf.newStatus === 'Lulus' ? moveDate : null }); setMoveConf({ isOpen: false, student: null, newStatus: '' }); } catch(e){}
  };

  const openEdit = (s) => {
    setEditingId(s.id);
    setFormData({ name: s.name, program: s.program||'pemulihan', className: s.className||'', subject: s.subject||'Pemulihan BM', ic: s.ic||'', gender: s.gender||'', mbkType: s.mbkType||'MBK', status: s.status||'Active', photoUrl: s.photoUrl||'', remarks: s.remarks||'', docLink: s.docLink||'', isNewStudent: s.isNewStudent||false, qrCodeUrl: s.qrCodeUrl||'' });
    setIsModalOpen(true);
  };
  const openAdd = () => {
    setEditingId(null);
    setFormData({ name: '', program: currentSection==='mbk'?'mbk':'pemulihan', className: '', subject: 'Pemulihan BM', ic: '', gender: '', mbkType: 'MBK', status: 'Active', photoUrl: '', remarks: '', docLink: '', isNewStudent: false, qrCodeUrl: '' });
    setIsModalOpen(true);
  };

  // Derived
  const avYrs = useMemo(()=>['All',...Array.from(new Set(students.filter(s=>s.program==='pemulihan').map(s=>getYearFromClassString(s.className)))).sort()], [students]);
  const avCls = useMemo(()=>['All',...Array.from(new Set(students.filter(s=>s.program==='pemulihan').map(s=>s.className).filter(Boolean))).sort()], [students]);

  const fS = useMemo(() => students.filter(s => {
    const isM = s.program === 'mbk', isL = s.status === 'Lulus', y = getStudentCurrentYear(s);
    if (currentSection === 'mbk') return isM && y <= 6 && (filters.year === 'All' || filters.year === '' || s.name.toLowerCase().includes(filters.year.toLowerCase()));
    if (currentSection === 'progress') return !isM && !isL && y <= 3 && (filters.year === 'All' || y === parseInt(filters.year)) && (filters.class === 'All' || s.className === filters.class) && (filters.subject === 'All' || s.subject === filters.subject) && (!filters.search || s.name.toLowerCase().includes(filters.search.toLowerCase()));
    if (currentSection === 'stats') return !isM && !isL && y <= 3 && (filters.statsYear === 'All' || y === parseInt(filters.statsYear)) && (filters.statsGender === 'All' || s.gender === filters.statsGender) && (filters.statsSubject === 'All' || s.subject === filters.statsSubject);
    return false;
  }), [students, currentSection, filters]);

  const grpP = useMemo(() => { const g={}; students.filter(s=>s.program==='pemulihan'&&s.status!=='Lulus'&&getStudentCurrentYear(s)<=3&&(filters.year==='All'||getStudentCurrentYear(s)===parseInt(filters.year))&&(filters.class==='All'||s.className===filters.class)&&(filters.subject==='All'||s.subject===filters.subject)).forEach(s=>{if(!g[s.className])g[s.className]=[];g[s.className].push(s)}); return g; }, [students, currentSection, filters]);
  const grpPl = useMemo(() => { const g={}; students.filter(s=>s.program==='pemulihan'&&s.status!=='Lulus'&&getStudentCurrentYear(s)>=4&&getStudentCurrentYear(s)<=6).forEach(s=>{const k=`Tahun ${getStudentCurrentYear(s)}`; if(!g[k])g[k]=[];g[k].push(s)}); return g; }, [students, currentSection]);
  const grpL = useMemo(() => { const g={}; students.filter(s=>s.status==='Lulus').forEach(s=>{const k=`Tahun ${calcLulusYear(s.className, s.graduationDate)}`; if(!g[k])g[k]={students:[]}; g[k].students.push(s)}); return g; }, [students, currentSection]);
  const lstUpd = useMemo(() => calculateLastUpdated(students), [students]);

  // Reusable Student Card
  const StudentCard = ({ s, sec }) => {
    const isMbk = sec==='mbk', isL = sec==='lulus', isP = sec==='profile', isPl = sec==='plan';
    const st = calcStats(s.attendanceRecords), yr = getStudentCurrentYear(s);
    const thmColor = isL ? 'purple' : isMbk ? 'indigo' : isPl ? 'blue' : (st.percent >= 75 ? 'emerald' : 'amber');
    const gradStr = `bg-gradient-to-b sm:bg-gradient-to-r from-${thmColor}-400 to-${thmColor}-600`;

    return (
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-slate-200 transition-all duration-300 hover:-translate-y-1 relative group overflow-hidden flex flex-col">
        {/* Desktop View */}
        <div className={`hidden sm:flex flex-col items-center gap-4 ${isMbk ? 'p-6' : 'p-3'}`}>
          <Avatar name={s.name} color={s.color} photoUrl={s.photoUrl} size={isMbk?"w-24 h-24":"w-20 h-20"} onClick={() => { if(s.photoUrl) setFullScreenImage(s.photoUrl); }}/>
          <div className="w-full text-center">
            <h3 className={`font-bold ${isMbk?'text-lg':'text-sm'} text-slate-900 leading-tight mb-1`}>{s.name}</h3>
            {isMbk ? (
               <>
                 <div className="flex items-center justify-center gap-2 mb-3"><CreditCard size={16} className="text-slate-400" /><span className="font-bold text-slate-700 font-mono">{s.ic}</span></div>
                 <div className="bg-indigo-50 p-2 rounded-lg text-sm font-medium text-indigo-900 mb-2">{yr<1?'Pra':`Tahun ${yr}`}</div>
                 <div className="text-sm text-slate-600 font-medium">{s.gender} • <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.mbkType==='OKU'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{s.mbkType||'MBK'}</span></div>
               </>
            ) : (
               <>
                 <div className="text-xs font-medium text-slate-600 mb-0.5">{s.className||s.subject}</div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{s.gender||'Lelaki'}</p>
                 {!isL && <div className={`inline-block text-[10px] font-bold text-white px-2 py-0.5 rounded-md mb-2 shadow-sm ${getSubjectBadgeColor(s.subject)}`}>{s.subject}</div>}
                 {isL && <div className="text-[10px] text-purple-600 font-semibold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 inline-block mt-2">Grad: {s.graduationDate}</div>}
               </>
            )}

            {isP && (
              <div className="flex flex-col gap-1 w-full mt-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase"><span>Attendance</span><span className={st.percent>=75?'text-emerald-600':'text-amber-600'}>{st.percent}%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"><div className={`h-full rounded-full ${st.percent>=75?'bg-emerald-500':'bg-amber-500'}`} style={{width:`${st.percent}%`}}></div></div>
              </div>
            )}
          </div>
          {isMbk && s.remarks && <div className="w-full mt-2 p-3 bg-yellow-50 border rounded-lg flex items-start gap-2"><MessageSquare size={16} className="text-yellow-600 mt-0.5" /><p className="text-xs text-slate-700 italic">{s.remarks}</p></div>}
          {isMbk && <div className="w-full pt-4 border-t flex gap-2"><button onClick={() => window.open(s.docLink, '_blank')} disabled={!s.docLink} className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white py-2.5 rounded-xl shadow-sm ${s.docLink?'bg-indigo-600 hover:bg-indigo-700':'bg-slate-300'}`}><FileText size={16} /> Docs</button></div>}

          {/* Admin Buttons Desktop */}
          {role === 'admin' && (
            <div className={`absolute top-2 right-2 flex ${isMbk?'':'flex-col'} gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg backdrop-blur-sm shadow-sm`}>
               {(!isMbk && !isL) && <button onClick={()=>openNotesModal(s)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded"><StickyNote size={14}/></button>}
               {isP && <button onClick={()=>openAttendanceModal(s)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Calendar size={14}/></button>}
               <button onClick={()=>openEdit(s)} className={`p-1.5 ${isL?'text-slate-400 hover:text-blue-600':'text-slate-400 hover:text-indigo-600'} rounded`}><Edit2 size={14}/></button>
               {!isMbk && <button onClick={()=>toggleStudentStatus(s)} className={`p-1.5 ${isL?'text-slate-400 hover:text-purple-600':'text-purple-500 hover:bg-purple-50'} rounded`}><RotateCcw size={14}/></button>}
               <button onClick={()=>confirmDelete(s)} className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
            </div>
          )}
        </div>

        {/* Mobile View */}
        <div className="sm:hidden flex flex-row items-start p-3 gap-3 relative z-10">
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${gradStr}`}></div>
          <div className="flex flex-col items-center gap-2">
            <Avatar name={s.name} color={s.color||'bg-blue-500'} photoUrl={s.photoUrl} size="w-16 h-16" onClick={()=>{if(s.photoUrl) setFullScreenImage(s.photoUrl);}}/>
            {role === 'admin' && (
                <div className="grid grid-cols-2 gap-1 w-[70px]">
                   {(!isMbk && !isL) && <button onClick={()=>openNotesModal(s)} className="p-1 text-amber-500 bg-amber-50 rounded border border-amber-100"><StickyNote size={12}/></button>}
                   {isP && <button onClick={()=>openAttendanceModal(s)} className="p-1 text-blue-500 bg-blue-50 rounded border border-blue-100"><Calendar size={12}/></button>}
                   <button onClick={()=>openEdit(s)} className="p-1 text-slate-500 bg-slate-50 rounded border border-slate-100"><Edit2 size={12}/></button>
                   {!isMbk && <button onClick={()=>toggleStudentStatus(s)} className="p-1 text-purple-500 bg-purple-50 rounded border border-purple-100"><RotateCcw size={12}/></button>}
                   <button onClick={()=>confirmDelete(s)} className={`p-1 text-red-500 bg-red-50 rounded border border-red-100 flex justify-center ${isMbk||isL?'col-span-2':''}`}><Trash2 size={12}/></button>
                </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0 text-left">
            <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1 break-words">{s.name}</h3>
            <div className="text-xs font-medium text-slate-600 mb-0.5">{isMbk ? (yr<1?'Pra':`Thn ${yr}`) : (s.className||s.subject)}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
               {s.gender||'Lelaki'}
               {isMbk && <span className={`px-1.5 py-0.5 rounded border text-[9px] ${s.mbkType==='OKU'?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-amber-50 text-amber-700 border-amber-200'}`}>{s.mbkType||'MBK'}</span>}
            </div>
            {!isMbk && !isL && <div className={`inline-block text-[10px] font-bold text-white px-2 py-0.5 rounded-md mb-1 ${getSubjectBadgeColor(s.subject)}`}>{s.subject}</div>}
            
            {isP && (
              <div className="flex flex-col gap-1 w-full mt-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase"><span>Attendance</span><span className={st.percent>=75?'text-emerald-600':'text-amber-600'}>{st.percent}%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"><div className={`h-full rounded-full ${st.percent>=75?'bg-emerald-500':'bg-amber-500'}`} style={{width:`${st.percent}%`}}></div></div>
              </div>
            )}

            {isMbk && s.remarks && <div className="text-[10px] text-slate-500 italic bg-yellow-50 px-2 py-1 rounded border flex items-start gap-1 mt-1"><MessageSquare size={10} className="mt-0.5 flex-shrink-0" /><span className="line-clamp-2">{s.remarks}</span></div>}
            {isMbk && (
              <div className="mt-2 flex flex-col sm:flex-row gap-1">
                <button onClick={()=>window.open(s.docLink, '_blank')} disabled={!s.docLink} className={`flex items-center justify-center gap-1 text-[10px] font-bold py-1 px-2 rounded border ${s.docLink?'bg-indigo-50 text-indigo-600':'bg-slate-50 text-slate-400'}`}><FileText size={12}/> Docs</button>
                {s.qrCodeUrl && <button onClick={()=>setFullScreenImage(s.qrCodeUrl)} className="flex items-center justify-center gap-1 text-[10px] font-bold py-1 px-2 rounded border bg-emerald-50 text-emerald-600"><QrCode size={12}/> QR</button>}
              </div>
            )}
            {isL && <div className="text-[10px] text-purple-600 font-semibold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 inline-block mt-1">Grad: {s.graduationDate}</div>}
          </div>
        </div>

        {s.isNewStudent && <div className="absolute top-2 left-3 sm:top-2 sm:right-2 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse z-20 flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-white rounded-full"></span> NEW</div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 font-sans selection:bg-indigo-100 pb-24">
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3"><div className="bg-indigo-600 p-2.5 rounded-xl shadow-md"><GraduationCap className="text-white h-6 w-6" /></div><span className="font-bold text-xl hidden sm:block">Profile Murid <span className="text-indigo-600">Digital</span></span></div>
            <div className="bg-slate-100/80 backdrop-blur-sm rounded-full p-1 flex items-center text-xs font-bold shadow-inner">
               <button onClick={()=>handleRoleSwitch('admin')} className={`px-4 py-1.5 rounded-full transition-all ${role==='admin'?'bg-white shadow-sm text-indigo-600':'text-slate-500'}`}>{role==='admin'&&<Shield size={12} className="inline mr-1"/>}Admin</button>
               <button onClick={()=>handleRoleSwitch('user')} className={`px-4 py-1.5 rounded-full transition-all ${role==='user'?'bg-white shadow-sm text-indigo-600':'text-slate-500'}`}>User</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center mb-8">
          <div className="w-full overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 flex sm:justify-center">
            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border gap-1 min-w-max">
              {[{id:'profile', l:'Profile Pemulihan'}, {id:'plan', l:'PLaN'}, {id:'mbk', l:'MBK & OKU'}, {id:'lulus', l:'Lulus'}, {id:'stats', l:'Statistik'}, {id:'progress', l:'Progress'}].map(t => (
                <button key={t.id} onClick={()=>handleTab(t.id)} className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${currentSection===t.id?'bg-indigo-600 text-white shadow-md':'text-slate-500 hover:bg-slate-50'}`}>{t.l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* STATS */}
        {currentSection === 'stats' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Filter size={20} className="text-indigo-500"/> Find Database</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative"><select className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-medium appearance-none" value={filters.statsYear} onChange={e=>updateFilter('statsYear', e.target.value)}>{avYrs.map(y=><option key={y} value={y}>{y==='All'?'Semua Tahun':`Tahun ${y}`}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none"/></div>
                <div className="relative"><select className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-medium appearance-none" value={filters.statsGender} onChange={e=>updateFilter('statsGender', e.target.value)}><option value="All">Semua Jantina</option><option value="Lelaki">Lelaki</option><option value="Perempuan">Perempuan</option></select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none"/></div>
                <div className="relative"><select className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-medium appearance-none" value={filters.statsSubject} onChange={e=>updateFilter('statsSubject', e.target.value)}><option value="All">Semua Subjek</option>{subjects.map(s=><option key={s} value={s}>{s}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none"/></div>
              </div>
            </div>
            <div className="bg-orange-50 p-8 rounded-2xl border flex justify-between shadow-sm"><div><p className="text-sm font-bold uppercase text-orange-600">Students Found (Pemulihan)</p><h2 className="text-5xl font-extrabold text-orange-900 mt-1">{filteredStudents.length}</h2></div><PieChart className="text-orange-500 w-12 h-12 bg-orange-100 p-2 rounded-2xl"/></div>
            {filteredStudents.length > 0 && (
              <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap"><thead className="bg-slate-50 border-b"><tr><th className="p-4 font-bold">Name</th><th className="p-4 font-bold">Gender</th><th className="p-4 font-bold">Class</th><th className="p-4 font-bold">Subject</th><th className="p-4 font-bold">Status</th></tr></thead><tbody className="divide-y">{filteredStudents.map(s=><tr key={s.id} className="hover:bg-slate-50"><td className="p-4 font-bold">{s.name}</td><td className="p-4">{s.gender||'Lelaki'}</td><td className="p-4"><span className="bg-slate-100 rounded px-2 py-1">{s.className}</span></td><td className="p-4">{s.subject}</td><td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${s.status==='Lulus'?'bg-purple-100 text-purple-700':'bg-emerald-100 text-emerald-700'}`}>{s.status||'Active'}</span></td></tr>)}</tbody></table>
              </div>
            )}
          </div>
        )}

        {/* PROGRESS */}
        {currentSection === 'progress' && (
           <div className="animate-in fade-in slide-in-from-bottom-4">
             {selProg ? (
               <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                 <div className="bg-slate-50 border-b p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4"><Avatar name={selProg.name} photoUrl={selProg.photoUrl} size="w-20 h-20"/><div><h3 className="font-bold text-xl">{selProg.name}</h3><p className="text-sm text-slate-500 mb-1">{selProg.className}</p><div className={`inline-block px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm ${getSubjectBadgeColor(selProg.subject)}`}>{selProg.subject}</div></div></div>
                    <button onClick={()=>setSelProg(null)} className="px-4 py-2 bg-white border rounded-xl hover:bg-slate-50 font-bold shadow-sm">Change Student</button>
                 </div>
                 <div className="flex border-b">
                    {selProg.subject.includes('BM') && <button onClick={()=>setProgSub('BM')} className={`flex-1 py-4 font-bold text-sm ${progSub==='BM'?'bg-white text-indigo-600 border-b-2 border-indigo-600':'bg-slate-50 text-slate-500'}`}>Bahasa Melayu</button>}
                    {selProg.subject.includes('Matematik') && <button onClick={()=>setProgSub('MATH')} className={`flex-1 py-4 font-bold text-sm ${progSub==='MATH'?'bg-white text-emerald-600 border-b-2 border-emerald-600':'bg-slate-50 text-slate-500'}`}>Matematik</button>}
                 </div>
                 <div className="p-6">
                    <div className="mb-8"><div className="flex justify-between items-end mb-2"><h4 className="font-bold text-lg">Overall Progress</h4><span className="text-sm font-bold text-slate-500">{progData[progSub==='BM'?'bm':'math']?.length||0} / {progSub==='BM'?KEMAHIRAN_BM.length:KEMAHIRAN_MATH.length}</span></div><RetroProgressBar progress={((progData[progSub==='BM'?'bm':'math']?.length||0)/(progSub==='BM'?KEMAHIRAN_BM.length:KEMAHIRAN_MATH.length))*100}/></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                       {(progSub==='BM'?KEMAHIRAN_BM:KEMAHIRAN_MATH).map((skill, index) => {
                          const i = index+1, isComp = progData[progSub==='BM'?'bm':'math']?.includes(i);
                          return <div key={i} onClick={()=>{if(role==='admin')toggleSkill(i)}} className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${isComp?(progSub==='BM'?'bg-indigo-50 border-indigo-200':'bg-emerald-50 border-emerald-200'):'bg-white'}`}><div className={`w-6 h-6 rounded-md flex items-center justify-center border ${isComp?(progSub==='BM'?'bg-indigo-600 border-indigo-600 text-white':'bg-emerald-600 border-emerald-600 text-white'):'bg-white'}`}>{isComp&&<Check size={16} strokeWidth={3}/>}</div><span className={`text-sm font-medium ${isComp?'text-slate-900':'text-slate-500'}`}>{skill}</span></div>;
                       })}
                    </div>
                    {role==='admin' && <div className="mt-8 pt-6 border-t flex justify-end"><button onClick={handleProgSave} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg active:scale-95"><Save size={18}/> Save Progress</button></div>}
                 </div>
               </div>
             ) : (
               <div className="bg-white rounded-3xl border shadow-sm p-6 md:p-12 text-center">
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"><TrendingUp className="text-indigo-600 w-8 h-8"/></div><h2 className="text-2xl font-bold mb-2">Student Progress Tracker</h2><p className="text-slate-500 mb-8">Select a student to update their skills.</p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full mb-4">
                        <div className="relative flex-1"><select className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 font-bold text-sm appearance-none" value={filters.year} onChange={e=>updateFilter('year', e.target.value)}>{avYrs.map(y=><option key={y} value={y}>{y==='All'?'Find: All Years':`Tahun ${y}`}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                        <div className="relative flex-1"><select className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 font-bold text-sm appearance-none" value={filters.class} onChange={e=>updateFilter('class', e.target.value)}>{avCls.map(c=><option key={c} value={c}>{c==='All'?'Find: All Classes':c}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                        <div className="relative flex-1"><select className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 font-bold text-sm appearance-none" value={filters.subject} onChange={e=>updateFilter('subject', e.target.value)}><option value="All">Find: All Subjects</option>{subjects.map(s=><option key={s} value={s}>{s}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                    </div>
                    <div className="relative mb-6"><Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" /><input type="text" placeholder="Search name..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 font-medium" value={filters.search} onChange={e=>updateFilter('search', e.target.value)} /></div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                       {filteredStudents.map(s => <button key={s.id} onClick={()=>{setSelProg(s);setProgData(s.progress||{});setProgSub(s.subject.includes('Matematik')&&!s.subject.includes('BM')?'MATH':'BM');}} className="w-full flex items-center gap-3 p-3 bg-white border rounded-xl hover:border-indigo-200 transition-all text-left group"><Avatar name={s.name} photoUrl={s.photoUrl} size="w-10 h-10"/><div><h4 className="font-bold group-hover:text-indigo-700">{s.name}</h4><p className="text-xs text-slate-500">{s.className}</p></div><ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-indigo-400"/></button>)}
                       {filteredStudents.length===0 && <p className="text-slate-400 text-sm py-4">No students found.</p>}
                    </div>
                  </div>
               </div>
             )}
           </div>
        )}

        {/* LIST VIEWS (Profile, Plan, Mbk, Lulus) */}
        {(['profile', 'plan', 'mbk', 'lulus'].includes(currentSection)) && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex flex-col lg:flex-row gap-4 mb-8 justify-between items-start lg:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                {currentSection === 'profile' && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative"><select className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border rounded-xl font-bold text-sm appearance-none" value={filters.year} onChange={e=>updateFilter('year', e.target.value)}>{avYrs.map(y=><option key={y} value={y}>{y==='All'?'Filter: All Years':`Tahun ${y}`}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none"/></div>
                    <div className="relative"><select className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border rounded-xl font-bold text-sm appearance-none" value={filters.class} onChange={e=>updateFilter('class', e.target.value)}>{avCls.map(c=><option key={c} value={c}>{c==='All'?'Filter: All Classes':c}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none"/></div>
                    <div className="relative"><select className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border rounded-xl font-bold text-sm appearance-none" value={filters.subject} onChange={e=>updateFilter('subject', e.target.value)}><option value="All">Filter: All Subjects</option>{subjects.map(s=><option key={s} value={s}>{s}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none"/></div>
                  </div>
                )}
                {currentSection === 'mbk' && <h2 className="text-2xl font-extrabold text-indigo-900">Senarai Murid MBK</h2>}
                {currentSection === 'plan' && <h2 className="text-2xl font-extrabold text-blue-900">PLaN (Thn 4-6)</h2>}
                {currentSection === 'lulus' && <h2 className="text-2xl font-extrabold text-purple-900">Graduates (Lulus)</h2>}

                <div className="flex gap-3 w-full lg:w-auto items-center ml-auto">
                   {lastUpdatedString && <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg hidden lg:inline-block whitespace-nowrap"><RefreshCw size={10} className="inline mr-1"/> {lastUpdatedString}</span>}
                   {(role === 'admin' && currentSection !== 'lulus' && currentSection !== 'plan') && <button onClick={openAdd} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-2.5 rounded-xl shadow-md font-bold text-sm"><Plus size={18} strokeWidth={2.5}/> Add Student</button>}
                   <button onClick={exportToExcel} className="flex-1 lg:flex-none flex items-center justify-center gap-2 text-sm text-slate-600 font-bold bg-white px-5 py-2.5 border rounded-xl hover:bg-slate-50"><Download size={18} /> Excel</button>
                </div>
             </div>

             {loading ? <div className="text-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mx-auto mb-4"></div><p>Loading...</p></div> : 
               (currentSection === 'profile' && Object.keys(grpP).length === 0) || (currentSection === 'plan' && Object.keys(grpPl).length === 0) || (currentSection === 'mbk' && filteredStudents.length === 0) || (currentSection === 'lulus' && Object.keys(grpL).length === 0) ? 
               <div className="text-center py-24 bg-white rounded-3xl border border-dashed shadow-sm"><Users className="text-slate-300 w-10 h-10 mx-auto mb-4"/><h3 className="text-xl font-bold">No students found</h3></div> : 
               <div className="space-y-10">
                  {currentSection === 'profile' && Object.keys(grpP).sort().map(c=><div key={c} className="bg-white rounded-3xl border shadow-sm overflow-hidden"><div className={`px-8 py-4 border-b ${getClassColorStyle(c).border} flex justify-between bg-white`}><h3 className={`font-extrabold ${getClassColorStyle(c).text} text-lg flex items-center gap-3`}><School className={getClassColorStyle(c).icon} size={20}/>{c}</h3><span className={`text-xs font-bold ${getClassColorStyle(c).icon} px-3 py-1.5 border rounded-lg shadow-sm`}>{grpP[c].length} Students</span></div><div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{grpP[c].map(s=><StudentCard key={s.id} s={s} sec="profile"/>)}</div></div>)}
                  {currentSection === 'plan' && Object.keys(grpPl).sort().map(c=><div key={c} className="bg-white rounded-3xl border shadow-sm overflow-hidden"><div className="px-8 py-4 border-b bg-blue-50/50 flex justify-between"><h3 className="font-extrabold text-blue-900 text-lg flex items-center gap-2"><BookOpenCheck className="text-blue-500" size={20}/>{c}</h3><span className="text-xs font-bold text-blue-700 px-3 py-1.5 border bg-white rounded-lg shadow-sm">{grpPl[c].length} Students</span></div><div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{grpPl[c].map(s=><StudentCard key={s.id} s={s} sec="plan"/>)}</div></div>)}
                  {currentSection === 'mbk' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{filteredStudents.map(s=><StudentCard key={s.id} s={s} sec="mbk"/>)}</div>}
                  {currentSection === 'lulus' && Object.keys(grpL).sort().map(c=><div key={c} className="bg-white rounded-3xl border shadow-sm overflow-hidden"><div className="px-8 py-4 border-b bg-purple-50/50 flex justify-between"><h3 className="font-extrabold text-purple-900 text-lg flex items-center gap-2"><Calendar className="text-purple-500" size={20}/>{c}</h3><span className="text-xs font-bold text-purple-700 px-3 py-1.5 border bg-white rounded-lg shadow-sm">{grpL[c].students.length} Students</span></div><div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{grpL[c].students.map(s=><StudentCard key={s.id} s={s} sec="lulus"/>)}</div></div>)}
               </div>
             }
           </div>
        )}

        {/* Global Modals rendered at main level */}
        {rawImageSrc && <ImageAdjuster imageSrc={rawImageSrc} onSave={handleCropSave} onCancel={handleCropCancel} />}
        {fullScreenImage && <ImageViewer src={fullScreenImage} onClose={() => setFullScreenImage(null)} />}
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t flex justify-around items-center z-50 sm:hidden pb-safe">
         {[{ id: 'profile', l: 'Profile', i: School }, { id: 'plan', l: 'PLaN', i: BookOpenCheck }, { id: 'mbk', l: 'MBK', i: Accessibility }, { id: 'lulus', l: 'Lulus', i: GraduationCap }, { id: 'stats', l: 'Stats', i: BarChart3 }, { id: 'progress', l: 'Progress', i: TrendingUp }].map(t => (
            <button key={t.id} onClick={()=>handleTab(t.id)} className={`flex flex-col items-center justify-center w-full py-2 ${currentSection===t.id?'text-indigo-600':'text-slate-400'}`}><t.i size={20} strokeWidth={currentSection===t.id?2.5:2}/><span className="text-[10px] font-bold mt-1">{t.l}</span></button>
         ))}
      </div>
      
      <Modal isOpen={showAdminLogin} onClose={()=>{setShowAdminLogin(false); setLoginError('');}} title="Admin Login">
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <input type="password" placeholder="Password" autoFocus className="w-full p-2 border rounded" value={adminPassword} onChange={e=>{setAdminPassword(e.target.value); setLoginError('');}}/>
          {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
          <button className="w-full py-2 bg-blue-600 text-white font-bold rounded">Login</button>
        </form>
      </Modal>

      <Modal isOpen={deleteConfirmation.isOpen} onClose={()=>setDeleteConfirmation({isOpen:false})} title="Confirm Deletion">
        <p className="mb-4 text-center">Delete <span className="font-bold">{deleteConfirmation.studentName}</span>?</p>
        <div className="flex gap-3"><button onClick={()=>setDeleteConfirmation({isOpen:false})} className="flex-1 py-2 bg-slate-100 font-bold rounded">Cancel</button><button onClick={execDel} className="flex-1 py-2 bg-red-600 text-white font-bold rounded">Delete</button></div>
      </Modal>

      <Modal isOpen={moveConfirmation.isOpen} onClose={()=>setMoveConf({isOpen:false})} title="Change Status">
        <p className="mb-4 text-center">Change status to: <span className="font-bold">{moveConfirmation.newStatus}</span></p>
        {moveConfirmation.newStatus === 'Lulus' && <input type="date" value={moveDate} onChange={e=>setMoveDate(e.target.value)} className="w-full p-2 border rounded mb-4"/>}
        <div className="flex gap-3"><button onClick={()=>setMoveConf({isOpen:false})} className="flex-1 py-2 bg-slate-100 font-bold rounded">Cancel</button><button onClick={execMove} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded">Confirm</button></div>
      </Modal>

      <Modal isOpen={isNotesModalOpen} onClose={()=>setIsNotesModalOpen(false)} title="Catatan">
        <div className="flex gap-3 mb-4"><Avatar name={selNote?.name||''} photoUrl={selNote?.photoUrl}/><div className="font-bold">{selNote?.name}</div></div>
        <form onSubmit={saveNote} className="space-y-3">
          <input type="date" required className="w-full p-2 border rounded" value={noteForm.date} onChange={e=>setNoteForm(p=>({...p, date:e.target.value}))}/>
          <textarea required rows="3" className="w-full p-2 border rounded" value={noteForm.text} onChange={e=>setNoteForm(p=>({...p, text:e.target.value}))}/>
          <button className="w-full py-2 bg-amber-600 text-white font-bold rounded">{noteForm.id?'Update':'Add'} Note</button>
        </form>
        <div className="mt-4 max-h-40 overflow-auto space-y-2">
          {selNote?.notes?.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(n=>(
            <div key={n.id} className="p-2 bg-slate-50 border rounded text-sm group relative"><span className="font-bold block mb-1">{n.date}</span>{n.text}
              <div className="absolute top-2 right-2 hidden group-hover:flex gap-2 bg-white/90 p-1"><button onClick={()=>startEditNote(n)}><Edit2 size={14} className="text-blue-500"/></button><button onClick={()=>deleteNote(n.id)}><Trash2 size={14} className="text-red-500"/></button></div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isAttendanceModalOpen} onClose={()=>setIsAttendanceModalOpen(false)} title="Attendance">
         <div className="flex gap-3 mb-4"><Avatar name={selAtt?.name||''} photoUrl={selAtt?.photoUrl}/><div className="font-bold">{selAtt?.name}</div></div>
         <input type="date" className="w-full p-2 border rounded mb-3" value={attendanceDate} onChange={e=>setAttDate(e.target.value)}/>
         <div className="flex gap-2 mb-4"><button onClick={()=>markAtt('present')} className="flex-1 py-2 bg-emerald-100 text-emerald-700 font-bold rounded">Present</button><button onClick={()=>markAtt('absent')} className="flex-1 py-2 bg-red-100 text-red-700 font-bold rounded">Absent</button></div>
         <div className="max-h-40 overflow-auto divide-y">
            {selAtt?.attendanceRecords?.sort((a,b)=>new Date(b.date)-new Date(a.date)).map((r,i)=>(
              <div key={i} className="py-2 flex justify-between"><span className="font-medium text-sm">{r.date}</span><div className="flex gap-3 items-center"><span className={`text-xs font-bold px-2 py-0.5 rounded ${r.status==='present'?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>{r.status}</span><button onClick={()=>deleteAttendanceRecord(r)}><Trash2 size={14} className="text-slate-400 hover:text-red-500"/></button></div></div>
            ))}
         </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} title={editingId ? "Edit Student" : "Add Student"}>
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          {!editingId && <div className="flex bg-slate-100 p-1 rounded-lg"><button type="button" onClick={()=>setFormData(p=>({...p,program:'pemulihan'}))} className={`flex-1 py-1.5 rounded ${formData.program==='pemulihan'?'bg-white font-bold shadow-sm':''}`}>Pemulihan</button><button type="button" onClick={()=>setFormData(p=>({...p,program:'mbk'}))} className={`flex-1 py-1.5 rounded ${formData.program==='mbk'?'bg-white font-bold shadow-sm':''}`}>MBK & OKU</button></div>}
          <div className="flex flex-col items-center p-3 border-2 border-dashed rounded-lg">
            <Avatar name={formData.name||'Student'} photoUrl={formData.photoUrl} size="w-16 h-16"/>
            <label className="text-blue-600 font-bold cursor-pointer mt-2 flex items-center gap-1"><Camera size={14}/> {formData.photoUrl?'Change':'Upload'} Photo<input type="file" hidden accept="image/*" onChange={e=>handleImgUp(e,'profile')}/></label>
            {formData.photoUrl && <div className="flex gap-2 mt-1"><button type="button" onClick={()=>{setRawImageSrc(formData.photoUrl);setUploadType('profile');}} className="text-xs text-blue-500">Adjust</button><button type="button" onClick={()=>handleRemovePhoto('profile')} className="text-xs text-red-500">Remove</button></div>}
          </div>
          <input required placeholder="Full Name" className="w-full p-2 border rounded focus:ring-2" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})}/>
          <div className="flex gap-4"><label className="flex items-center gap-1"><input type="radio" checked={formData.gender==='Lelaki'} onChange={()=>setFormData({...formData,gender:'Lelaki'})}/> Lelaki</label><label className="flex items-center gap-1"><input type="radio" checked={formData.gender==='Perempuan'} onChange={()=>setFormData({...formData,gender:'Perempuan'})}/> Perempuan</label></div>
          {formData.program === 'pemulihan' ? (
            <>
              <input placeholder="IC Number (Optional)" className="w-full p-2 border rounded focus:ring-2 font-mono" value={formData.ic} onChange={e=>setFormData({...formData,ic:e.target.value.replace(/\D/g,'')})} maxLength={12}/>
              <input required placeholder="Class Name (e.g. 2 Hebat)" className="w-full p-2 border rounded focus:ring-2 font-mono" value={formData.className} onChange={handleClassNameChange}/>
              <select className="w-full p-2 border rounded" value={formData.subject} onChange={e=>setFormData({...formData,subject:e.target.value})}>{subjects.map(s=><option key={s} value={s}>{s}</option>)}</select>
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isNewStudent} onChange={e=>setFormData({...formData,isNewStudent:e.target.checked})}/> Murid Baru (插班生)</label>
            </>
          ) : (
            <>
              <div className="flex gap-4"><label className="flex items-center gap-1"><input type="radio" checked={formData.mbkType==='MBK'} onChange={()=>setFormData({...formData,mbkType:'MBK'})}/> MBK (Tiada Kad)</label><label className="flex items-center gap-1"><input type="radio" checked={formData.mbkType==='OKU'} onChange={()=>setFormData({...formData,mbkType:'OKU'})}/> OKU (Ada Kad)</label></div>
              <input required placeholder="MyKid / IC" className="w-full p-2 border rounded font-mono" value={formData.ic} onChange={e=>setFormData({...formData,ic:e.target.value.replace(/\D/g,'')})} maxLength={12}/>
              <textarea placeholder="Remarks..." className="w-full p-2 border rounded" rows="2" value={formData.remarks} onChange={e=>setFormData({...formData,remarks:e.target.value})}/>
              <input placeholder="Document Link URL" className="w-full p-2 border rounded" value={formData.docLink} onChange={e=>setFormData({...formData,docLink:e.target.value})}/>
              {formData.mbkType === 'OKU' && (
                <div className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between">
                  <span className="font-medium text-slate-700">QR Code (Kad OKU)</span>
                  <div className="flex items-center gap-2">
                    {formData.qrCodeUrl ? <button type="button" onClick={()=>handleRemovePhoto('qr')} className="text-red-500 text-xs">Remove</button> : null}
                    <label className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded cursor-pointer font-bold text-xs">Upload<input type="file" hidden accept="image/*" onChange={e=>handleImgUp(e,'qr')}/></label>
                  </div>
                </div>
              )}
            </>
          )}
          <div className="flex gap-2 pt-2"><button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 font-bold rounded-lg">Cancel</button><button type="submit" className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg">Save</button></div>
        </form>
      </Modal>

    </div>
  );
}
