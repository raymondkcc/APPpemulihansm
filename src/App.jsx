import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Plus, Edit2, Trash2, Shield, Download, CheckCircle, XCircle, GraduationCap,
  BookOpen, PieChart, Camera, Lock, ArrowRight, RotateCcw, Calendar, Clock, Check, X,
  Filter, BarChart3, ArrowLeftRight, Accessibility, School, StickyNote, MessageSquare, 
  FileText, ZoomIn, ZoomOut, Sparkles, QrCode, TrendingUp, Save, Search, ChevronDown, Menu, ExternalLink
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import * as XLSX from 'xlsx';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDm56Tm6lr00XIHTIMSLiiLe1c6vfV1_vo",
  authDomain: "student-db-v2.firebaseapp.com",
  projectId: "student-db-v2",
  storageBucket: "student-db-v2.firebasestorage.app",
  messagingSenderId: "480502571708",
  appId: "1:480502571708:web:7707c9db995a53da9b66b9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'my-school-database';

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
const cardColors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];

// --- UI Components ---
const RetroProgressBar = ({ progress }) => (
  <div className="w-full bg-gray-200 rounded-md p-1 border border-gray-400 shadow-inner">
    <div className="relative w-full h-6 bg-white border border-gray-300 rounded-sm overflow-hidden">
      <div 
        className="h-full bg-gradient-to-b from-green-400 via-green-500 to-green-600 relative overflow-hidden transition-all duration-500 ease-out flex items-center" 
        style={{ width: `${progress}%` }}
      >
        <div className="absolute top-0 left-0 w-full h-full animate-progress-shine opacity-30 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12"></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-shadow-sm mix-blend-difference text-white">
        {Math.round(progress)}% Completed
      </div>
    </div>
    <style>{`
      @keyframes progress-shine {
        0% { transform: translateX(-100%) skewX(-12deg); }
        100% { transform: translateX(200%) skewX(-12deg); }
      }
      .animate-progress-shine { animation: progress-shine 2s linear infinite; }
    `}</style>
  </div>
);

const ImageAdjuster = ({ imageSrc, onSave, onCancel, title = "Adjust Photo" }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const handleMouseDown = (e) => { 
    setIsDragging(true); 
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y }); 
  };
  const handleMouseMove = (e) => { 
    if (isDragging) setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); 
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleTouchStart = (e) => { 
    setIsDragging(true); 
    setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y }); 
  };
  const handleTouchMove = (e) => { 
    if (isDragging) setPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y }); 
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    const size = 500;
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    const containerSize = containerRef.current.clientWidth;
    const ratio = size / containerSize;
    const drawX = (position.x * ratio) + (size / 2) - ((img.width * scale * ratio) / 2);
    const drawY = (position.y * ratio) + (size / 2) - ((img.height * scale * ratio) / 2);
    const drawWidth = img.width * scale * ratio;
    const drawHeight = img.height * scale * ratio;
    
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    onSave(canvas.toDataURL('image/jpeg', 0.8));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <div 
            ref={containerRef}
            className="w-64 h-64 bg-slate-100 rounded-xl overflow-hidden relative cursor-move touch-none border-2 border-slate-200 shadow-inner"
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleMouseUp}
          >
            <img 
              ref={imageRef} 
              src={imageSrc} 
              alt="Edit" 
              className="absolute max-w-none origin-center pointer-events-none select-none" 
              style={{ transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`, left: '50%', top: '50%' }} 
              draggable="false" 
            />
            <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-xl pointer-events-none"></div>
          </div>
          <div className="w-full flex items-center gap-3 text-slate-500">
             <ZoomOut size={16} />
             <input type="range" min="0.1" max="3" step="0.05" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
             <ZoomIn size={16} />
          </div>
          <p className="text-center text-xs text-slate-400">Drag to move • Pinch/Slider to zoom</p>
        </div>
        <div className="p-4 border-t border-slate-100 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2.5 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200">Save</button>
        </div>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
};

const ImageViewer = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200" onClick={onClose}>
       <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
         <X size={32} />
       </button>
       <img src={src} alt="Full Screen" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  );
};

const Avatar = ({ name, color, photoUrl, size = "w-12 h-12", onClick }) => {
  const commonClasses = `${size} rounded-xl shadow-sm border-2 border-white ring-1 ring-gray-100 flex-shrink-0 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`;
  if (photoUrl) {
    return <img src={photoUrl} alt={name} className={`${commonClasses} object-cover object-top bg-white`} onClick={onClick} />;
  }
  const initials = (name || '?').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  return <div className={`${commonClasses} flex items-center justify-center text-white font-bold shadow-sm ${color}`}>{initials}</div>;
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-bold text-lg text-slate-800 tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors">
            <XCircle size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- Helper Logic Functions ---
const calculateSchoolYearFromIC = (ic) => {
  if (!ic) return null;
  const icStr = String(ic).replace(/\D/g, ''); 
  if (icStr.length < 2) return null;
  const yearPrefix = parseInt(icStr.substring(0, 2));
  if (isNaN(yearPrefix)) return null;
  const birthYear = 2000 + yearPrefix; 
  return new Date().getFullYear() - birthYear - 6;
};

const getYearFromClassString = (className) => {
  if (!className) return null;
  const yearInt = parseInt(String(className).split(' ')[0]);
  return isNaN(yearInt) ? null : yearInt;
};

const getStudentCurrentYear = (student) => {
  const icYear = calculateSchoolYearFromIC(student.ic);
  if (icYear !== null && icYear > 0) return icYear;
  const classYear = getYearFromClassString(student.className);
  if (classYear !== null) return classYear;
  return 0; 
};

const calculateCurrentLulusYear = (className, graduationDate) => {
  const originalYear = getYearFromClassString(className);
  if (originalYear === null) return 99; 
  const gradYear = (graduationDate ? new Date(graduationDate) : new Date()).getFullYear();
  return originalYear + (new Date().getFullYear() - gradYear);
};

const getClassColorStyle = (className) => {
  const safeClassName = String(className || 'Unknown');
  const palettes = [
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', icon: 'text-blue-600' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', icon: 'text-emerald-600' },
    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', icon: 'text-amber-600' },
    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', icon: 'text-purple-600' },
    { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', icon: 'text-rose-600' },
    { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900', icon: 'text-cyan-600' }
  ];
  let hash = 0;
  for (let i = 0; i < safeClassName.length; i++) hash = safeClassName.charCodeAt(i) + ((hash << 5) - hash);
  return palettes[Math.abs(hash) % palettes.length];
};

const getSubjectBadgeColor = (subject) => {
  if (subject === 'Pemulihan BM') return 'bg-blue-600';
  if (subject === 'Pemulihan Matematik') return 'bg-orange-500';
  return 'bg-purple-600';
};

const calculateStats = (records) => {
  if (!records || records.length === 0) return { percent: 0, present: 0, total: 0 };
  const present = records.filter(r => r.status === 'present').length;
  return { percent: Math.round((present / records.length) * 100), present, total: records.length };
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) { return ''; }
};

// --- Main App Component ---
export default function StudentDatabaseApp() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [role, setRole] = useState('user'); 
  const [currentSection, setCurrentSection] = useState('profile'); 
  
  // Filters
  const [profileYearFilter, setProfileYearFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [statsFilters, setStatsFilters] = useState({ year: 'All', gender: 'All', subject: 'All' });

  // Auth & Modals
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', program: 'pemulihan', className: '', subject: 'Pemulihan BM', ic: '', gender: 'Lelaki', mbkType: 'MBK', status: 'Active', photoUrl: '', remarks: '', docLink: '', isNewStudent: false, qrCodeUrl: ''
  });

  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null); 
  const [uploadType, setUploadType] = useState('profile');

  // Progress State
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState(null);
  const [progressSubject, setProgressSubject] = useState('BM');
  const [studentProgressData, setStudentProgressData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmations & Actions
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, studentId: null, studentName: '' });
  const [moveConfirmation, setMoveConfirmation] = useState({ isOpen: false, student: null, newStatus: '' });
  const [moveDate, setMoveDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedStudentForNotes, setSelectedStudentForNotes] = useState(null);
  const [noteForm, setNoteForm] = useState({ id: null, text: '', date: new Date().toISOString().split('T')[0] });

  // --- Effects ---
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setRole(currentUser.email === "admin@pemulihan.com" ? 'admin' : 'user');
      } else {
        signInAnonymously(auth).catch((err) => console.error("Anon auth error", err));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setStudents(snapshot.docs.map(doc => ({ id: doc.id, attendanceRecords: [], notes: [], ...doc.data() })));
        setLoading(false);
      }, (error) => { 
        console.error("Firestore error:", error); 
        setLoading(false); 
      }
    );
    return () => unsubscribe();
  }, [user]);

  // --- Handlers ---
  const handleTabChange = (tabId) => {
    setCurrentSection(tabId);
    if (tabId !== 'progress') {
       setProfileYearFilter('All'); 
       setClassFilter('All'); 
       setSubjectFilter('All');
       if (tabId === 'mbk') setProfileYearFilter(''); 
       setSelectedStudentForProgress(null); 
       setSearchQuery('');
    }
  };

  const handleRoleSwitch = async (targetRole) => {
    if (targetRole === 'admin') {
      if (role !== 'admin') setShowAdminLogin(true);
    } else {
      if (role === 'admin') {
         try { await signOut(auth); setRole('user'); } catch(e) { console.error("Logout failed", e); }
      }
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
        await signInWithEmailAndPassword(auth, "admin@pemulihan.com", adminPassword);
        setShowAdminLogin(false); 
        setAdminPassword(''); 
        setLoginError('');
    } catch (error) { 
        setLoginError('Incorrect password or account not setup.'); 
    }
  };

  const handleImageUpload = (e, type = 'profile') => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert("Image is too large. Please choose an image under 5MB."); return; }
      const reader = new FileReader();
      reader.onload = (event) => { setRawImageSrc(event.target.result); setUploadType(type); };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCropSave = (croppedImageBase64) => {
    if (uploadType === 'profile') {
      setFormData(prev => ({ ...prev, photoUrl: croppedImageBase64 }));
    } else {
      setFormData(prev => ({ ...prev, qrCodeUrl: croppedImageBase64 }));
    }
    setRawImageSrc(null);
  };

  const handleCropCancel = () => {
    setRawImageSrc(null);
  };

  const handleRemovePhoto = (type = 'profile') => {
    if(window.confirm(`Are you sure you want to remove the ${type === 'profile' ? 'profile photo' : 'QR code'}?`)) {
        if (type === 'profile') setFormData(prev => ({ ...prev, photoUrl: '' }));
        else setFormData(prev => ({ ...prev, qrCodeUrl: '' }));
    }
  };
  
  const handleClassNameChange = (e) => {
    let val = e.target.value.toUpperCase();
    val = val.replace(/^(\d)([A-Z])/, '$1 $2');
    setFormData({ ...formData, className: val });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user || !db) return;
    if (!formData.gender) { alert("Please select a gender (Jantina) before saving."); return; }
    
    try {
      const dataToSave = {
        name: formData.name, 
        program: formData.program, 
        gender: formData.gender, 
        status: formData.status,
        photoUrl: formData.photoUrl || '', 
        updatedAt: serverTimestamp(), 
        ic: formData.ic || '', 
        isNewStudent: formData.isNewStudent || false
      };
      
      if (formData.program === 'pemulihan') {
        dataToSave.className = formData.className; 
        dataToSave.subject = formData.subject;
        dataToSave.mbkType = ''; 
        dataToSave.remarks = ''; 
        dataToSave.docLink = ''; 
        dataToSave.qrCodeUrl = '';
      } else {
        dataToSave.mbkType = formData.mbkType; 
        dataToSave.remarks = formData.remarks || ''; 
        dataToSave.docLink = formData.docLink || ''; 
        dataToSave.qrCodeUrl = formData.qrCodeUrl || '';
        dataToSave.className = ''; 
        dataToSave.subject = '';
      }

      if (editingId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), {
          ...dataToSave, 
          attendanceRecords: [], 
          notes: [], 
          color: cardColors[Math.floor(Math.random() * cardColors.length)], 
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false); 
      setEditingId(null);
    } catch (err) { console.error("Error saving:", err); }
  };
  
  const handleProgressUpdate = async () => {
    if (!user || !selectedStudentForProgress || !db) return;
    try {
       await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentForProgress.id), { 
         progress: studentProgressData 
       });
       alert("Progress saved successfully!");
    } catch (err) { 
       console.error("Error saving progress:", err); 
       alert("Failed to save progress."); 
    }
  };
  
  const toggleSkill = (skillIndex) => {
    const currentSubjectKey = progressSubject === 'BM' ? 'bm' : 'math';
    const currentSkills = studentProgressData[currentSubjectKey] || [];
    let newSkills = currentSkills.includes(skillIndex) 
      ? currentSkills.filter(i => i !== skillIndex) 
      : [...currentSkills, skillIndex];
      
    setStudentProgressData(prev => ({ ...prev, [currentSubjectKey]: newSkills }));
  };

  const exportToExcel = () => {
    if (!students || students.length === 0) { alert("No data to export."); return; }
    const workbook = XLSX.utils.book_new();
    const formatStudent = (s) => ({
      Name: s.name, Gender: s.gender, IC: s.ic || '', Class: s.className || '', Subject: s.subject || '',
      Program: s.program === 'mbk' ? (s.mbkType || 'MBK') : 'Pemulihan', Status: s.status, Remarks: s.remarks || '',
      DocLink: s.docLink || '', LastUpdated: s.updatedAt ? new Date(s.updatedAt.toDate ? s.updatedAt.toDate() : s.updatedAt).toLocaleDateString() : ''
    });

    const addSheet = (data, name) => { if(data.length > 0) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), name); };
    
    addSheet(students.filter(s => s.program === 'pemulihan' && s.status !== 'Lulus' && getStudentCurrentYear(s) <= 3).map(formatStudent), "Profile");
    addSheet(students.filter(s => s.program === 'pemulihan' && s.status !== 'Lulus' && getStudentCurrentYear(s) >= 4 && getStudentCurrentYear(s) <= 6).map(formatStudent), "PLaN");
    addSheet(students.filter(s => s.program === 'mbk').map(formatStudent), "MBK");
    addSheet(students.filter(s => s.status === 'Lulus').map(s => ({ ...formatStudent(s), GraduationDate: s.graduationDate || '' })), "Lulus");
    
    XLSX.writeFile(workbook, "Student_Database.xlsx");
  };

  const executeDelete = async () => {
    if (!user || role !== 'admin' || !deleteConfirmation.studentId || !db) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', deleteConfirmation.studentId));
      setDeleteConfirmation({ isOpen: false, studentId: null, studentName: '' });
    } catch (err) { console.error("Error deleting:", err); }
  };

  const markAttendance = async (status) => {
    if (!user || !selectedStudentForAttendance || !db) return;
    const newRecord = { date: attendanceDate, status: status, timestamp: Date.now() };
    try {
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentForAttendance.id);
      const existingRecord = selectedStudentForAttendance.attendanceRecords?.find(r => r.date === newRecord.date);
      if (existingRecord) await updateDoc(ref, { attendanceRecords: arrayRemove(existingRecord) });
      await updateDoc(ref, { attendanceRecords: arrayUnion(newRecord) });
    } catch (err) { console.error("Error marking attendance:", err); }
  };

  const deleteAttendanceRecord = async (record) => {
    if (!user || !selectedStudentForAttendance || !db) return;
    try { 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentForAttendance.id), { 
        attendanceRecords: arrayRemove(record) 
      }); 
    } catch (err) { console.error("Error deleting record:", err); }
  };

  const saveNote = async (e) => {
    e.preventDefault();
    if (!user || !selectedStudentForNotes || !db) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentForNotes.id);
    let newNotes = [...(selectedStudentForNotes.notes || [])];
    if (noteForm.id) {
      newNotes = newNotes.map(n => n.id === noteForm.id ? { ...n, text: noteForm.text, date: noteForm.date } : n);
    } else {
      newNotes.push({ id: Date.now().toString(), text: noteForm.text, date: noteForm.date, timestamp: Date.now() });
    }
    
    try {
      await updateDoc(ref, { notes: newNotes });
      setNoteForm({ id: null, text: '', date: new Date().toISOString().split('T')[0] }); 
    } catch (err) { console.error("Error saving note:", err); }
  };

  const deleteNote = async (noteId) => {
    if (!user || !selectedStudentForNotes || !db) return;
    if (!window.confirm('Delete this note?')) return;
    const newNotes = (selectedStudentForNotes.notes || []).filter(n => n.id !== noteId);
    try { 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentForNotes.id), { notes: newNotes }); 
    } catch (err) { console.error("Error deleting note:", err); }
  };

  const executeMove = async () => {
    if (!user || role !== 'admin' || !moveConfirmation.student || !db) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', moveConfirmation.student.id), { 
        status: moveConfirmation.newStatus, 
        graduationDate: moveConfirmation.newStatus === 'Lulus' ? moveDate : null 
      });
      setMoveConfirmation({ isOpen: false, student: null, newStatus: '' });
    } catch (err) { console.error("Error updating status:", err); }
  };

  const openEdit = (student) => {
    setEditingId(student.id);
    setFormData({
      name: student.name, program: student.program || 'pemulihan', className: student.className || '',
      subject: student.subject || 'Pemulihan BM', ic: student.ic || '', gender: student.gender || 'Lelaki',
      mbkType: student.mbkType || 'MBK', status: student.status || 'Active', photoUrl: student.photoUrl || '',
      remarks: student.remarks || '', docLink: student.docLink || '', isNewStudent: student.isNewStudent || false, qrCodeUrl: student.qrCodeUrl || ''
    });
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ name: '', program: currentSection === 'mbk' ? 'mbk' : 'pemulihan', className: '', subject: 'Pemulihan BM', ic: '', gender: 'Lelaki', mbkType: 'MBK', status: 'Active', photoUrl: '', remarks: '', docLink: '', isNewStudent: false, qrCodeUrl: '' });
    setIsModalOpen(true);
  };
  
  const openNotesModal = (student) => {
    setSelectedStudentForNotes(student);
    setNoteForm({ id: null, text: '', date: new Date().toISOString().split('T')[0] });
    setIsNotesModalOpen(true);
  };

  const openAttendanceModal = (student) => {
    setSelectedStudentForAttendance(student);
    setAttendanceDate(new Date().toISOString().split('T')[0]);
    setIsAttendanceModalOpen(true);
  };
  
  const toggleStudentStatus = (student) => {
    setMoveDate(new Date().toISOString().split('T')[0]);
    setMoveConfirmation({ isOpen: true, student: student, newStatus: student.status === 'Lulus' ? 'Active' : 'Lulus' });
  };

  const handleCheckOKU = (ic) => {
    if (!ic) return;
    const textArea = document.createElement("textarea");
    textArea.value = ic; document.body.appendChild(textArea); textArea.select();
    try { document.execCommand('copy'); } catch (err) { console.error('Copy failed', err); }
    document.body.removeChild(textArea);
    window.open('https://oku.jkm.gov.my/semakan_oku', '_blank');
  };

  // --- Filtering & Derived State ---
  const availableYears = useMemo(() => {
    const years = students.filter(s => s.program === 'pemulihan').map(s => getYearFromClassString(s.className)).filter(y => y !== null);
    return ['All', ...Array.from(new Set(years)).sort()];
  }, [students]);

  const availableClasses = useMemo(() => {
    return ['All', ...Array.from(new Set(students.filter(s => s.program === 'pemulihan').map(s => s.className).filter(Boolean))).sort()];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const year = getStudentCurrentYear(s);
      
      if (currentSection === 'mbk') {
        return s.program === 'mbk' && year <= 6 && (profileYearFilter === 'All' || profileYearFilter === '' || (s.name || '').toLowerCase().includes(profileYearFilter.toLowerCase()));
      }
      
      if (currentSection === 'progress') {
         if (s.program !== 'pemulihan' || s.status === 'Lulus' || year > 3) return false; 
         return (profileYearFilter === 'All' || year === parseInt(profileYearFilter)) &&
                (classFilter === 'All' || s.className === classFilter) &&
                (subjectFilter === 'All' || s.subject === subjectFilter) &&
                (searchQuery === '' || (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
      }

      if (currentSection === 'stats') {
        if (s.program === 'mbk' || s.status === 'Lulus' || year > 3) return false;
        return (statsFilters.year === 'All' || year === parseInt(statsFilters.year)) &&
               (statsFilters.gender === 'All' || (s.gender || 'Lelaki') === statsFilters.gender) &&
               (statsFilters.subject === 'All' || s.subject === statsFilters.subject);
      }
      return false;
    });
  }, [students, profileYearFilter, classFilter, subjectFilter, currentSection, statsFilters, searchQuery]);

  // Groupings for main tabs
  const groupedProfileStudents = useMemo(() => {
    if (currentSection !== 'profile') return {};
    const groups = {};
    students.filter(s => s.program === 'pemulihan' && s.status !== 'Lulus' && getStudentCurrentYear(s) <= 3 && 
        (profileYearFilter === 'All' || getStudentCurrentYear(s) === parseInt(profileYearFilter)) &&
        (classFilter === 'All' || s.className === classFilter) &&
        (subjectFilter === 'All' || s.subject === subjectFilter)
    ).forEach(s => { 
        const clsName = s.className || 'No Class';
        if (!groups[clsName]) groups[clsName] = []; 
        groups[clsName].push(s); 
    });
    return groups;
  }, [students, currentSection, profileYearFilter, classFilter, subjectFilter]);

  const groupedPlanStudents = useMemo(() => {
    if (currentSection !== 'plan') return {};
    const groups = {};
    students.filter(s => s.program === 'pemulihan' && s.status !== 'Lulus' && getStudentCurrentYear(s) >= 4 && getStudentCurrentYear(s) <= 6)
            .forEach(s => { 
                const k = `Tahun ${getStudentCurrentYear(s)}`; 
                if (!groups[k]) groups[k] = []; 
                groups[k].push(s); 
            });
    return groups;
  }, [students, currentSection]);

  const groupedLulusStudents = useMemo(() => {
    if (currentSection !== 'lulus') return {};
    const groups = {};
    students.filter(s => s.status === 'Lulus').forEach(s => { 
      const k = `Tahun ${calculateCurrentLulusYear(s.className, s.graduationDate)}`; 
      if (!groups[k]) groups[k] = { students: [] }; 
      groups[k].students.push(s); 
    });
    return groups;
  }, [students, currentSection]);

  const lastUpdatedString = useMemo(() => {
    let list = currentSection === 'profile' ? Object.values(groupedProfileStudents).flat() :
               currentSection === 'plan' ? Object.values(groupedPlanStudents).flat() :
               currentSection === 'lulus' ? Object.values(groupedLulusStudents).flatMap(g => g.students) : filteredStudents;
    
    let maxDate = 0;
    list.forEach(s => {
      let t = 0;
      try { 
         if (s.updatedAt) t = s.updatedAt.toDate ? s.updatedAt.toDate().getTime() : new Date(s.updatedAt).getTime(); 
      } catch(e){}
      if (t > maxDate) maxDate = t;
    });
    return maxDate === 0 ? null : new Date(maxDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }, [currentSection, groupedProfileStudents, groupedPlanStudents, groupedLulusStudents, filteredStudents]);


  // Reusable Student Card Component for the Grid Views
  const renderStudentCard = (student, sectionType) => {
    const isMbk = sectionType === 'mbk';
    const isLulus = sectionType === 'lulus';
    const isProfile = sectionType === 'profile';
    const isPlan = sectionType === 'plan';
    
    const year = getStudentCurrentYear(student);
    const stats = calculateStats(student.attendanceRecords || []);
    
    let themeColor = 'blue';
    let gradientClass = 'from-blue-400 to-blue-600';
    
    if (isLulus) {
        themeColor = 'purple';
        gradientClass = 'from-purple-400 to-purple-600';
    } else if (isMbk) {
        themeColor = 'indigo';
        gradientClass = 'from-indigo-400 to-indigo-600';
    } else if (isProfile) {
        themeColor = stats.percent >= 75 ? 'emerald' : 'amber';
        gradientClass = stats.percent >= 75 ? 'from-emerald-400 to-emerald-600' : 'from-amber-400 to-amber-600';
    }

    return (
      <div key={student.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-slate-200 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden flex flex-col">
        
        {/* === Desktop Layout (Vertical) === */}
        <div className={`hidden sm:flex flex-col items-center gap-4 ${isMbk ? 'p-6' : 'p-4'}`}>
          <Avatar name={student.name} color={student.color} photoUrl={student.photoUrl} size={isMbk ? "w-24 h-24" : "w-16 h-16"} onClick={() => { if(student.photoUrl) setFullScreenImage(student.photoUrl); }}/>
          
          <div className="w-full text-center">
            <h3 className={`font-bold ${isMbk ? 'text-lg' : 'text-sm'} text-slate-900 leading-tight mb-1 break-words`}>{student.name}</h3>
            
            {isMbk ? (
               <>
                 <div className="flex items-center justify-center gap-2 mb-3"><CreditCard size={16} className="text-slate-400" /><span className="font-bold text-slate-700 tracking-wide font-mono">{student.ic}</span></div>
                 <div className="bg-indigo-50 p-2 rounded-lg text-sm font-medium text-indigo-900 mb-2">{year < 1 ? 'Pra' : `Tahun ${year}`}</div>
                 <div className="text-sm text-slate-600 font-medium">{student.gender} • <span className={`px-2 py-0.5 rounded text-xs font-bold ${student.mbkType === 'OKU' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{student.mbkType || 'MBK'}</span></div>
               </>
            ) : (
               <>
                 <div className="text-xs font-medium text-slate-600 mb-0.5">{student.className || student.subject}</div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{student.gender}</p>
                 {!isLulus && <div className={`inline-block text-[10px] font-bold text-white px-2 py-0.5 rounded-md uppercase tracking-wide mb-2 shadow-sm ${getSubjectBadgeColor(student.subject)}`}>{student.subject}</div>}
                 {isLulus && <div className="text-[10px] text-purple-600 font-semibold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 inline-block mt-1">Grad: {student.graduationDate}</div>}
               </>
            )}

            {isProfile && (
              <div className="flex flex-col gap-1 w-full mt-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                  <span>Attendance</span>
                  <span className={stats.percent >= 75 ? 'text-emerald-600' : 'text-amber-600'}>{stats.percent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"><div className={`h-full rounded-full ${stats.percent >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${stats.percent}%` }}></div></div>
              </div>
            )}
          </div>
          
          {isMbk && student.remarks && <div className="w-full mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 text-left"><MessageSquare size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" /><p className="text-xs text-slate-700 italic">{student.remarks}</p></div>}
          
          {isMbk && (
            <div className="mt-2 w-full pt-4 border-t border-slate-100 flex flex-col gap-2">
              <button onClick={() => window.open(student.docLink, '_blank')} disabled={!student.docLink} className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white py-2.5 rounded-xl transition-all shadow-sm ${student.docLink ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'}`}><FileText size={16} /> Docs</button>
              <button onClick={() => handleCheckOKU(student.ic)} className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 py-2.5 rounded-xl transition-all shadow-sm"><Search size={16} /> Semakan OKU</button>
            </div>
          )}

          {/* Desktop Admin Hover Controls */}
          {role === 'admin' && (
            <div className={`absolute top-2 right-2 flex ${isMbk ? 'flex-row' : 'flex-col'} gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg backdrop-blur-sm shadow-sm`}>
               {(!isMbk && !isLulus) && <button onClick={() => openNotesModal(student)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded transition-colors" title="Notes"><StickyNote size={14} /></button>}
               {isProfile && <button onClick={() => openAttendanceModal(student)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors" title="Attendance"><Calendar size={14} /></button>}
               <button onClick={() => openEdit(student)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors" title="Edit"><Edit2 size={14} /></button>
               {!isMbk && <button onClick={() => toggleStudentStatus(student)} className="p-1.5 text-purple-500 hover:bg-purple-50 rounded transition-colors" title="Change Status"><RotateCcw size={14} /></button>}
               <button onClick={() => confirmDelete(student)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 size={14} /></button>
            </div>
          )}
        </div>

        {/* === Mobile Layout (Compact Horizontal) === */}
        <div className="sm:hidden flex flex-row items-start p-3 gap-3 relative z-10">
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${gradientClass}`}></div>
          
          <div className="flex flex-col items-center gap-2">
            <Avatar name={student.name} color={student.color} photoUrl={student.photoUrl} size="w-16 h-16" onClick={() => { if(student.photoUrl) setFullScreenImage(student.photoUrl); }}/>
            
            {/* Mobile Admin Controls under Avatar */}
            {role === 'admin' && (
              <div className="grid grid-cols-2 gap-1 w-[70px]">
                 {(!isMbk && !isLulus) && <button onClick={() => openNotesModal(student)} className="p-1 text-amber-500 bg-amber-50 rounded border border-amber-100 flex justify-center"><StickyNote size={12} /></button>}
                 {isProfile && <button onClick={() => openAttendanceModal(student)} className="p-1 text-blue-500 bg-blue-50 rounded border border-blue-100 flex justify-center"><Calendar size={12} /></button>}
                 <button onClick={() => openEdit(student)} className={`p-1 text-slate-500 bg-slate-50 rounded border border-slate-100 flex justify-center ${isMbk || isLulus ? '' : 'col-span-2'}`}><Edit2 size={12} /></button>
                 {!isMbk && <button onClick={() => toggleStudentStatus(student)} className="p-1 text-purple-500 bg-purple-50 rounded border border-purple-100 flex justify-center"><RotateCcw size={12} /></button>}
                 <button onClick={() => confirmDelete(student)} className="p-1 text-red-500 bg-red-50 rounded border border-red-100 flex justify-center col-span-2"><Trash2 size={12} /></button>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0 text-left">
            <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1 break-words">{student.name}</h3>
            <div className="text-xs font-medium text-slate-600 mb-0.5">{isMbk ? (year < 1 ? 'Pra' : `Tahun ${year}`) : student.className}</div>
            
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
               {student.gender || 'Lelaki'}
               {isMbk && <span className={`px-1.5 py-0.5 rounded border text-[9px] ${student.mbkType === 'OKU' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{student.mbkType || 'MBK'}</span>}
            </div>
            
            {!isMbk && !isLulus && <div className={`inline-block text-[10px] font-bold text-white px-2 py-0.5 rounded-md mb-1 shadow-sm ${getSubjectBadgeColor(student.subject)}`}>{student.subject}</div>}

            {isProfile && (
              <div className="flex flex-col gap-1 w-full mt-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase"><span>Attendance</span><span className={stats.percent >= 75 ? 'text-emerald-600' : 'text-amber-600'}>{stats.percent}%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"><div className={`h-full rounded-full ${stats.percent >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${stats.percent}%` }}></div></div>
              </div>
            )}

            {isMbk && student.remarks && <div className="text-[10px] text-slate-500 italic bg-yellow-50 px-2 py-1 rounded border border-yellow-100 flex items-start gap-1 mt-1"><MessageSquare size={10} className="mt-0.5 flex-shrink-0" /><span className="line-clamp-2">{student.remarks}</span></div>}
            
            {isMbk && (
              <div className="mt-2 flex flex-col gap-1">
                 <button onClick={() => window.open(student.docLink, '_blank')} disabled={!student.docLink} className={`flex items-center justify-center gap-1 text-[10px] font-bold py-1 px-2 rounded border ${student.docLink ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}><FileText size={12} /> {student.docLink ? 'Docs' : 'No Docs'}</button>
                 <button onClick={() => handleCheckOKU(student.ic)} className="flex items-center justify-center gap-1 text-[10px] font-bold py-1 px-2 rounded border bg-slate-900 text-white"><Search size={12} /> Semakan OKU</button>
                 {student.qrCodeUrl && <button onClick={() => setFullScreenImage(student.qrCodeUrl)} className="flex items-center justify-center gap-1 text-[10px] font-bold py-1 px-2 rounded border bg-emerald-50 text-emerald-600 border-emerald-100"><QrCode size={12} /> QR Code</button>}
              </div>
            )}

            {isLulus && <div className="text-[10px] text-purple-600 font-semibold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 inline-block mt-1">Grad: {student.graduationDate}</div>}
          </div>
        </div>

        {student.isNewStudent && <div className="absolute top-2 left-3 sm:top-2 sm:right-2 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse z-20 flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-white rounded-full"></span> NEW</div>}
      </div>
    );
  };

  // --- Main Render Return ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 font-sans selection:bg-indigo-100 pb-24">
      
      {/* Top Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-md shadow-indigo-200"><GraduationCap className="text-white h-6 w-6" /></div>
              <span className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">Profile Murid <span className="text-indigo-600">Digital</span></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-slate-100/80 backdrop-blur-sm rounded-full p-1 flex items-center text-xs font-bold shadow-inner">
                <button onClick={() => handleRoleSwitch('admin')} className={`px-4 py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 ${role === 'admin' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>{role === 'admin' && <Shield size={12} className="text-indigo-500" />}Admin</button>
                <button onClick={() => handleRoleSwitch('user')} className={`px-4 py-1.5 rounded-full transition-all duration-300 ${role === 'user' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>User</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Desktop Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="w-full overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 flex sm:justify-center">
            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 gap-1 min-w-max">
              {[{ id: 'profile', label: 'Profile Pemulihan' }, { id: 'plan', label: 'PLaN' }, { id: 'mbk', label: 'Murid MBK & OKU' }, { id: 'lulus', label: 'Lulus' }, { id: 'stats', label: 'Statistik' }, { id: 'progress', label: 'Progress' }].map(tab => (
                <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 whitespace-nowrap ${currentSection === tab.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>{tab.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* --- STATS SECTION --- */}
        {currentSection === 'stats' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Filter size={20} className="text-indigo-500" /> Find Database</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative"><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Year</label><select className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none font-medium text-slate-700" value={statsFilters.year} onChange={(e) => setStatsFilters(p => ({...p, year: e.target.value}))}>{availableYears.map(y => <option key={y} value={y}>{y === 'All' ? 'Semua Tahun' : `Tahun ${y}`}</option>)}</select><ChevronDown className="absolute right-3 top-9 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                <div className="relative"><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Gender</label><select className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none font-medium text-slate-700" value={statsFilters.gender} onChange={(e) => setStatsFilters(p => ({...p, gender: e.target.value}))}><option value="All">Semua Jantina</option><option value="Lelaki">Lelaki</option><option value="Perempuan">Perempuan</option></select><ChevronDown className="absolute right-3 top-9 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                <div className="relative"><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Subject</label><select className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none font-medium text-slate-700" value={statsFilters.subject} onChange={(e) => setStatsFilters(p => ({...p, subject: e.target.value}))}><option value="All">Semua Subjek</option>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select><ChevronDown className="absolute right-3 top-9 text-slate-400 w-4 h-4 pointer-events-none" /></div>
              </div>
            </div>
            <div className="bg-orange-50 p-8 rounded-2xl border border-orange-100 flex items-center justify-between shadow-sm">
              <div><p className="text-sm text-orange-600 font-bold uppercase">Students Found (Pemulihan Only)</p><h2 className="text-5xl font-extrabold text-orange-900 mt-1">{filteredStudents.length}</h2></div>
              <div className="bg-orange-100 p-4 rounded-2xl"><PieChart className="text-orange-500 w-12 h-12" /></div>
            </div>
            {filteredStudents.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-sm whitespace-nowrap"><thead className="bg-slate-50 border-b"><tr><th className="px-6 py-4 font-bold text-slate-600">Name</th><th className="px-6 py-4 font-bold text-slate-600">Gender</th><th className="px-6 py-4 font-bold text-slate-600">Class</th><th className="px-6 py-4 font-bold text-slate-600">Subject</th></tr></thead><tbody className="divide-y">{filteredStudents.map(student => (<tr key={student.id} className="hover:bg-slate-50/80"><td className="px-6 py-4 font-bold">{student.name}</td><td className="px-6 py-4 text-slate-500">{student.gender || 'Lelaki'}</td><td className="px-6 py-4"><span className="bg-slate-100 rounded px-2 py-1 font-mono text-xs text-slate-600">{student.className}</span></td><td className="px-6 py-4 text-slate-500">{student.subject}</td></tr>))}</tbody></table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- PROGRESS SECTION --- */}
        {currentSection === 'progress' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {selectedStudentForProgress ? (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4"><Avatar name={selectedStudentForProgress.name} color={selectedStudentForProgress.color} photoUrl={selectedStudentForProgress.photoUrl} size="w-20 h-20" /><div><h3 className="font-bold text-xl text-slate-900">{selectedStudentForProgress.name}</h3><p className="text-sm text-slate-500 mb-1">{selectedStudentForProgress.className}</p><div className={`inline-block px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm ${getSubjectBadgeColor(selectedStudentForProgress.subject)}`}>{selectedStudentForProgress.subject}</div></div></div>
                    <button onClick={() => setSelectedStudentForProgress(null)} className="px-4 py-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 text-sm font-bold shadow-sm">Change Student</button>
                 </div>
                 <div className="flex border-b border-slate-200">
                    {(selectedStudentForProgress.subject === 'Pemulihan BM' || selectedStudentForProgress.subject === 'Pemulihan BM dan Matematik') && (<button onClick={() => setProgressSubject('BM')} className={`flex-1 py-4 text-center font-bold text-sm ${progressSubject === 'BM' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Bahasa Melayu</button>)}
                    {(selectedStudentForProgress.subject === 'Pemulihan Matematik' || selectedStudentForProgress.subject === 'Pemulihan BM dan Matematik') && (<button onClick={() => setProgressSubject('MATH')} className={`flex-1 py-4 text-center font-bold text-sm ${progressSubject === 'MATH' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Matematik</button>)}
                 </div>
                 <div className="p-6 md:p-8">
                    <div className="mb-8"><div className="flex justify-between items-end mb-2"><h4 className="font-bold text-lg text-slate-800">Overall Progress</h4><span className="text-sm font-bold text-slate-500">{studentProgressData[progressSubject === 'BM' ? 'bm' : 'math']?.length || 0} / {progressSubject === 'BM' ? KEMAHIRAN_BM.length : KEMAHIRAN_MATH.length}</span></div><RetroProgressBar progress={((studentProgressData[progressSubject === 'BM' ? 'bm' : 'math']?.length || 0) / (progressSubject === 'BM' ? KEMAHIRAN_BM.length : KEMAHIRAN_MATH.length)) * 100} /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                       {(progressSubject === 'BM' ? KEMAHIRAN_BM : KEMAHIRAN_MATH).map((skill, index) => {
                          const skillIndex = index + 1; const subjectKey = progressSubject === 'BM' ? 'bm' : 'math'; const isCompleted = studentProgressData[subjectKey]?.includes(skillIndex);
                          return (
                            <div key={index} onClick={() => { if(role === 'admin') toggleSkill(skillIndex); }} className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all duration-200 ${isCompleted ? (progressSubject === 'BM' ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-emerald-50 border-emerald-200 shadow-sm') : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                               <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${isCompleted ? (progressSubject === 'BM' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-emerald-600 border-emerald-600 text-white') : 'bg-white border-slate-300'}`}>{isCompleted && <Check size={16} strokeWidth={3} />}</div>
                               <span className={`text-sm font-medium ${isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>{skill}</span>
                            </div>
                          );
                       })}
                    </div>
                    {role === 'admin' && <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end"><button onClick={handleProgressUpdate} className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"><Save size={18} /> Save Progress</button></div>}
                 </div>
               </div>
             ) : (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-12 text-center">
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"><TrendingUp className="text-indigo-600 w-8 h-8" /></div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Student Progress Tracker</h2><p className="text-slate-500 mb-8">Select a student from the list below to view or update their mastery of skills (Kemahiran).</p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full mb-4">
                        <div className="relative group flex-1"><select className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm appearance-none" value={profileYearFilter} onChange={(e) => setProfileYearFilter(e.target.value)}>{availableYears.map(y => <option key={y} value={y}>{y === 'All' ? 'Find: All Years' : `Tahun ${y}`}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                        <div className="relative group flex-1"><select className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm appearance-none" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>{availableClasses.map(c => <option key={c} value={c}>{c === 'All' ? 'Find: All Classes' : c}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                        <div className="relative group flex-1"><select className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm appearance-none" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}><option value="All">Find: All Subjects</option>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                    </div>
                    <div className="relative mb-6"><Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" /><input type="text" placeholder="Search student name..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                       {filteredStudents.map(student => (
                         <button key={student.id} onClick={() => { setSelectedStudentForProgress(student); setStudentProgressData(student.progress || { bm: [], math: [] }); setProgressSubject((student.subject || '').includes('Matematik') && !(student.subject || '').includes('BM') ? 'MATH' : 'BM'); }} className="w-full flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all text-left group">
                            <Avatar name={student.name} color={student.color} photoUrl={student.photoUrl} size="w-10 h-10" /><div><h4 className="font-bold text-slate-800 group-hover:text-indigo-700">{student.name}</h4><p className="text-xs text-slate-500">{student.className}</p></div><ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-indigo-400" />
                         </button>
                       ))}
                       {filteredStudents.length === 0 && <p className="text-slate-400 text-sm py-4">No students found matching your search.</p>}
                    </div>
                  </div>
               </div>
             )}
           </div>
        )}

        {/* --- GRID VIEWS (Profile, PLaN, MBK, Lulus) --- */}
        {(['profile', 'plan', 'mbk', 'lulus'].includes(currentSection)) && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* Header & Controls */}
             <div className="flex flex-col lg:flex-row gap-4 mb-8 justify-between items-start lg:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                {currentSection === 'profile' && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative group"><select className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm appearance-none" value={profileYearFilter} onChange={(e) => setProfileYearFilter(e.target.value)}>{availableYears.map(y => <option key={y} value={y}>{y === 'All' ? 'Find: All Years' : `Tahun ${y}`}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                    <div className="relative group"><select className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm appearance-none" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>{availableClasses.map(c => <option key={c} value={c}>{c === 'All' ? 'Find: All Classes' : c}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                    <div className="relative group"><select className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm appearance-none" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}><option value="All">Find: All Subjects</option>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                  </div>
                )}
                {currentSection === 'plan' && <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight ml-4">PLaN (Thn 4-6)</h2>}
                {currentSection === 'mbk' && <h2 className="text-2xl font-extrabold text-indigo-900 tracking-tight ml-4">Senarai Murid MBK & OKU</h2>}
                {currentSection === 'lulus' && <h2 className="text-2xl font-extrabold text-purple-900 tracking-tight ml-4">Graduates (Lulus)</h2>}

                <div className="flex gap-3 w-full lg:w-auto items-center ml-auto">
                   {lastUpdatedString && <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg hidden lg:inline-block"><RefreshCw size={10} className="inline mr-1"/> {lastUpdatedString}</span>}
                   {(role === 'admin' && (currentSection === 'profile' || currentSection === 'mbk')) && <button onClick={openAdd} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 text-white px-5 py-2.5 rounded-xl shadow-md font-bold text-sm"><Plus size={18} strokeWidth={2.5}/> Add Student</button>}
                   <button onClick={exportToExcel} className="flex-1 lg:flex-none flex items-center justify-center gap-2 text-sm text-slate-600 font-bold bg-white px-5 py-2.5 border rounded-xl hover:bg-slate-50"><Download size={18} /> Export Excel</button>
                </div>
             </div>

             {/* Dynamic Grids */}
             {loading ? <div className="text-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mx-auto mb-4"></div><p>Loading database...</p></div> : 
               (currentSection === 'profile' && Object.keys(groupedProfileStudents).length === 0) || (currentSection === 'plan' && Object.keys(groupedPlanStudents).length === 0) || (currentSection === 'mbk' && filteredStudents.length === 0) || (currentSection === 'lulus' && Object.keys(groupedLulusStudents).length === 0) ? 
               <div className="text-center py-24 bg-white rounded-3xl border border-dashed shadow-sm"><Users className="text-slate-300 w-10 h-10 mx-auto mb-4"/><h3 className="text-xl font-bold">No students found</h3></div> : 
               
               <div className="space-y-10">
                  {/* Profile Groups */}
                  {currentSection === 'profile' && Object.keys(groupedProfileStudents).sort().map(className => {
                    const style = getClassColorStyle(className);
                    return (
                      <div key={className} className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                        <div className={`px-8 py-4 border-b ${style.border} flex justify-between bg-white`}><h3 className={`font-extrabold ${style.text} text-lg flex items-center gap-3`}><School className={style.icon} size={20}/>{className}</h3><span className={`text-xs font-bold bg-white ${style.icon} px-3 py-1.5 border rounded-lg shadow-sm`}>{groupedProfileStudents[className].length} Students</span></div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{groupedProfileStudents[className].map(s => renderStudentCard(s, 'profile'))}</div>
                      </div>
                    )
                  })}
                  
                  {/* PLaN Groups */}
                  {currentSection === 'plan' && Object.keys(groupedPlanStudents).sort().map(yearGrp => (
                    <div key={yearGrp} className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                      <div className="px-8 py-4 border-b bg-blue-50 flex justify-between"><h3 className="font-extrabold text-blue-900 text-lg flex items-center gap-2"><BookOpenCheck className="text-blue-500" size={20}/>{yearGrp}</h3><span className="text-xs font-bold text-blue-700 px-3 py-1.5 border bg-white rounded-lg shadow-sm">{groupedPlanStudents[yearGrp].length} Students</span></div>
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{groupedPlanStudents[yearGrp].map(s => renderStudentCard(s, 'plan'))}</div>
                    </div>
                  ))}

                  {/* MBK Flat List */}
                  {currentSection === 'mbk' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredStudents.map(s => renderStudentCard(s, 'mbk'))}
                    </div>
                  )}

                  {/* Lulus Groups */}
                  {currentSection === 'lulus' && Object.keys(groupedLulusStudents).sort().map(yearGrp => (
                    <div key={yearGrp} className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                      <div className="px-8 py-4 border-b bg-purple-50 flex justify-between"><h3 className="font-extrabold text-purple-900 text-lg flex items-center gap-2"><Calendar className="text-purple-500" size={20}/>{yearGrp}</h3><span className="text-xs font-bold text-purple-700 px-3 py-1.5 border bg-white rounded-lg shadow-sm">{groupedLulusStudents[yearGrp].students.length} Students</span></div>
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{groupedLulusStudents[yearGrp].students.map(s => renderStudentCard(s, 'lulus'))}</div>
                    </div>
                  ))}
               </div>
             }
           </div>
        )}

        {/* --- GLOBAL MODALS --- */}
        {rawImageSrc && <ImageAdjuster imageSrc={rawImageSrc} onSave={handleCropSave} onCancel={handleCropCancel} />}
        {fullScreenImage && <ImageViewer src={fullScreenImage} onClose={() => setFullScreenImage(null)} />}
      </main>

      {/* --- MOBILE BOTTOM NAV --- */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t flex justify-around items-center z-50 sm:hidden pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
         {[
           { id: 'profile', l: 'Profile', i: School }, { id: 'plan', l: 'PLaN', i: BookOpenCheck }, 
           { id: 'mbk', l: 'MBK', i: Accessibility }, { id: 'lulus', l: 'Lulus', i: GraduationCap }, 
           { id: 'stats', l: 'Stats', i: BarChart3 }, { id: 'progress', l: 'Prog', i: TrendingUp }
         ].map(t => (
            <button key={t.id} onClick={()=>handleTabChange(t.id)} className={`flex flex-col items-center justify-center w-full py-3 transition-colors ${currentSection===t.id?'text-indigo-600':'text-slate-400'}`}>
              <t.i size={20} strokeWidth={currentSection===t.id?2.5:2}/>
              <span className="text-[10px] font-bold mt-1">{t.l}</span>
            </button>
         ))}
      </div>
      
      {/* --- FUNCTIONAL MODALS --- */}
      
      {/* Admin Login */}
      <Modal isOpen={showAdminLogin} onClose={()=>{setShowAdminLogin(false); setLoginError('');}} title="Admin Login">
        <div className="flex flex-col items-center mb-6"><div className="bg-blue-50 p-3 rounded-full mb-3"><Lock className="text-blue-600 w-8 h-8" /></div><p className="text-sm text-gray-500">Enter admin password.</p></div>
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <input type="password" placeholder="Password" autoFocus className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={adminPassword} onChange={e=>{setAdminPassword(e.target.value); setLoginError('');}}/>
          {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
          <button className="w-full py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition-colors">Login</button>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={deleteConfirmation.isOpen} onClose={()=>setDeleteConfirmation({isOpen:false})} title="Confirm Deletion">
        <div className="flex flex-col items-center mb-6"><div className="bg-red-50 p-3 rounded-full mb-3"><Trash2 className="text-red-600 w-8 h-8" /></div><p>Delete <span className="font-bold">{deleteConfirmation.studentName}</span>?</p></div>
        <div className="flex gap-3"><button onClick={()=>setDeleteConfirmation({isOpen:false})} className="flex-1 py-2 bg-slate-100 font-bold rounded">Cancel</button><button onClick={executeDelete} className="flex-1 py-2 bg-red-600 text-white font-bold rounded">Delete</button></div>
      </Modal>

      {/* Move Status Confirmation */}
      <Modal isOpen={moveConfirmation.isOpen} onClose={()=>setMoveConfirmation({isOpen:false})} title="Change Status">
        <div className="flex flex-col items-center mb-6"><div className="bg-blue-50 p-3 rounded-full mb-3"><ArrowLeftRight className="text-blue-600 w-8 h-8" /></div><p className="mb-4">Change status to: <span className="font-bold">{moveConfirmation.newStatus}</span>?</p>
        {moveConfirmation.newStatus === 'Lulus' && <div className="w-full text-left"><label className="text-xs font-bold text-slate-500">Graduation Date</label><input type="date" value={moveDate} onChange={e=>setMoveDate(e.target.value)} className="w-full mt-1 p-2 border rounded"/></div>}</div>
        <div className="flex gap-3"><button onClick={()=>setMoveConfirmation({isOpen:false})} className="flex-1 py-2 bg-slate-100 font-bold rounded">Cancel</button><button onClick={executeMove} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded">Confirm</button></div>
      </Modal>

      {/* Notes Modal */}
      <Modal isOpen={isNotesModalOpen} onClose={()=>setIsNotesModalOpen(false)} title="Catatan">
        <div className="flex gap-3 mb-4"><Avatar name={selectedStudentForNotes?.name||''} photoUrl={selectedStudentForNotes?.photoUrl}/><div className="font-bold mt-1">{selectedStudentForNotes?.name}</div></div>
        <form onSubmit={saveNote} className="space-y-3">
          <input type="date" required className="w-full p-2 border rounded focus:ring-2 outline-none" value={noteForm.date} onChange={e=>setNoteForm(p=>({...p, date:e.target.value}))}/>
          <textarea required rows="3" placeholder="Notes here..." className="w-full p-2 border rounded focus:ring-2 outline-none" value={noteForm.text} onChange={e=>setNoteForm(p=>({...p, text:e.target.value}))}/>
          <button className="w-full py-2 bg-amber-600 text-white font-bold rounded hover:bg-amber-700">{noteForm.id?'Update':'Add'} Note</button>
        </form>
        <div className="mt-4 max-h-40 overflow-auto space-y-2">
          {selectedStudentForNotes?.notes?.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(n=>(
            <div key={n.id} className="p-3 bg-slate-50 border rounded text-sm group relative"><span className="font-bold text-slate-500 bg-white px-2 py-0.5 rounded border mr-2">{n.date}</span><p className="mt-2 whitespace-pre-wrap text-slate-700">{n.text}</p>
              <div className="absolute top-2 right-2 hidden group-hover:flex gap-1 bg-white/90 p-1 shadow-sm rounded"><button onClick={()=>startEditNote(n)} className="p-1"><Edit2 size={14} className="text-blue-500"/></button><button onClick={()=>deleteNote(n.id)} className="p-1"><Trash2 size={14} className="text-red-500"/></button></div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Attendance Modal */}
      <Modal isOpen={isAttendanceModalOpen} onClose={()=>setIsAttendanceModalOpen(false)} title="Attendance">
         <div className="flex gap-3 mb-4"><Avatar name={selectedStudentForAttendance?.name||''} photoUrl={selectedStudentForAttendance?.photoUrl}/><div className="font-bold mt-1">{selectedStudentForAttendance?.name}</div></div>
         <input type="date" className="w-full p-2 border rounded mb-3 focus:ring-2 outline-none" value={attendanceDate} onChange={e=>setAttendanceDate(e.target.value)}/>
         <div className="flex gap-2 mb-4"><button onClick={()=>markAttendance('present')} className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-100 text-emerald-700 font-bold rounded hover:bg-emerald-200"><Check size={16}/> Present</button><button onClick={()=>markAttendance('absent')} className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-100 text-red-700 font-bold rounded hover:bg-red-200"><X size={16}/> Absent</button></div>
         <div className="max-h-40 overflow-auto divide-y">
            {selectedStudentForAttendance?.attendanceRecords?.sort((a,b)=>new Date(b.date)-new Date(a.date)).map((r,i)=>(
              <div key={i} className="py-2 flex justify-between items-center"><span className="font-medium text-sm text-slate-700">{r.date}</span><div className="flex gap-3 items-center"><span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${r.status==='present'?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>{r.status}</span><button onClick={()=>deleteAttendanceRecord(r)}><Trash2 size={14} className="text-slate-400 hover:text-red-500"/></button></div></div>
            ))}
         </div>
      </Modal>

      {/* Add / Edit Form Modal */}
      <Modal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} title={editingId ? "Edit Student" : "Add Student"}>
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          {!editingId && (
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button type="button" onClick={()=>setFormData(p=>({...p,program:'pemulihan'}))} className={`flex-1 py-1.5 rounded transition-all ${formData.program==='pemulihan'?'bg-white font-bold shadow-sm text-blue-600':''}`}>Pemulihan</button>
              <button type="button" onClick={()=>setFormData(p=>({...p,program:'mbk'}))} className={`flex-1 py-1.5 rounded transition-all ${formData.program==='mbk'?'bg-white font-bold shadow-sm text-indigo-600':''}`}>MBK & OKU</button>
            </div>
          )}
          
          <div className="flex flex-col items-center p-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <Avatar name={formData.name||'Student'} photoUrl={formData.photoUrl} size="w-16 h-16"/>
            <label className="text-blue-600 font-bold cursor-pointer mt-2 flex items-center gap-1"><Camera size={14}/> {formData.photoUrl?'Change':'Upload'} Photo<input type="file" hidden accept="image/*" onChange={e=>handleImageUpload(e,'profile')}/></label>
            {formData.photoUrl && <div className="flex gap-2 mt-1"><button type="button" onClick={()=>{setRawImageSrc(formData.photoUrl);setUploadType('profile');}} className="text-xs text-blue-500 hover:underline">Adjust</button><button type="button" onClick={()=>handleRemovePhoto('profile')} className="text-xs text-red-500 hover:underline">Remove</button></div>}
          </div>

          <div><label className="block font-bold text-slate-600 mb-1">Full Name</label><input required placeholder="Full Name" className="w-full p-2.5 border rounded-xl focus:ring-2 outline-none" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})}/></div>
          
          <div>
            <label className="block font-bold text-slate-600 mb-1">Gender</label>
            <div className="flex gap-6"><label className="flex items-center gap-2"><input type="radio" checked={formData.gender==='Lelaki'} onChange={()=>setFormData({...formData,gender:'Lelaki'})}/> Lelaki</label><label className="flex items-center gap-2"><input type="radio" checked={formData.gender==='Perempuan'} onChange={()=>setFormData({...formData,gender:'Perempuan'})}/> Perempuan</label></div>
          </div>

          {formData.program === 'pemulihan' ? (
            <>
              <div><label className="block font-bold text-slate-600 mb-1">IC Number (for auto-year)</label><input placeholder="e.g. 1605..." className="w-full p-2.5 border rounded-xl font-mono focus:ring-2 outline-none" value={formData.ic} onChange={e=>setFormData({...formData,ic:e.target.value.replace(/\D/g,'')})} maxLength={12}/></div>
              <div><label className="block font-bold text-slate-600 mb-1">Class</label><input required placeholder="e.g. 2 Hebat" className="w-full p-2.5 border rounded-xl font-mono focus:ring-2 outline-none" value={formData.className} onChange={handleClassNameChange}/></div>
              <div><label className="block font-bold text-slate-600 mb-1">Subject</label><select className="w-full p-2.5 border rounded-xl focus:ring-2 outline-none" value={formData.subject} onChange={e=>setFormData({...formData,subject:e.target.value})}>{subjects.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
              <label className="flex items-center gap-2 font-bold text-slate-600"><input type="checkbox" checked={formData.isNewStudent} onChange={e=>setFormData({...formData,isNewStudent:e.target.checked})} className="w-4 h-4"/> Murid Baru (插班生)</label>
            </>
          ) : (
            <>
              <div><label className="block font-bold text-slate-600 mb-1">Category</label><div className="flex gap-6"><label className="flex items-center gap-2"><input type="radio" checked={formData.mbkType==='MBK'} onChange={()=>setFormData({...formData,mbkType:'MBK'})}/> MBK (Tiada Kad)</label><label className="flex items-center gap-2"><input type="radio" checked={formData.mbkType==='OKU'} onChange={()=>setFormData({...formData,mbkType:'OKU'})}/> OKU (Ada Kad)</label></div></div>
              <div><label className="block font-bold text-slate-600 mb-1">MyKid / IC</label><input required placeholder="e.g. 1605..." className="w-full p-2.5 border rounded-xl font-mono focus:ring-2 outline-none" value={formData.ic} onChange={e=>setFormData({...formData,ic:e.target.value.replace(/\D/g,'')})} maxLength={12}/></div>
              <div><label className="block font-bold text-slate-600 mb-1">Remarks</label><textarea placeholder="Remarks..." className="w-full p-2.5 border rounded-xl focus:ring-2 outline-none" rows="2" value={formData.remarks} onChange={e=>setFormData({...formData,remarks:e.target.value})}/></div>
              <div><label className="block font-bold text-slate-600 mb-1">Doc Link</label><input placeholder="https://..." className="w-full p-2.5 border rounded-xl focus:ring-2 outline-none" value={formData.docLink} onChange={e=>setFormData({...formData,docLink:e.target.value})}/></div>
              
              {formData.mbkType === 'OKU' && (
                <div className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-2"><QrCode size={16}/> Kad OKU QR</span>
                  <div className="flex items-center gap-3">
                    {formData.qrCodeUrl && <button type="button" onClick={()=>handleRemovePhoto('qr')} className="text-red-500 text-xs hover:underline">Remove</button>}
                    <label className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg cursor-pointer font-bold text-xs hover:bg-indigo-200 transition-colors">Upload<input type="file" hidden accept="image/*" onChange={e=>handleImageUpload(e,'qr')}/></label>
                  </div>
                </div>
              )}
            </>
          )}
          <div className="flex gap-3 pt-4"><button type="button" onClick={()=>setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200">Cancel</button><button type="submit" className={`flex-1 py-3 text-white font-bold rounded-xl shadow-sm ${formData.program==='mbk'?'bg-indigo-600 hover:bg-indigo-700':'bg-blue-600 hover:bg-blue-700'}`}>Save</button></div>
        </form>
      </Modal>
    </div>
  );
}
