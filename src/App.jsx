import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Shield, 
  Download, 
  CheckCircle, 
  XCircle,
  GraduationCap,
  BookOpen,
  PieChart,
  Camera,
  Lock,
  ArrowRight,
  RotateCcw,
  Calendar,
  Clock,
  Check,
  X,
  Filter,
  BarChart3,
  ArrowLeftRight,
  Accessibility,
  School,
  StickyNote,
  ExternalLink,
  CreditCard,
  ChevronDown,
  Menu,
  BookOpenCheck,
  RefreshCw,
  MessageSquare,
  FileText,
  Link as LinkIcon,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Maximize2,
  QrCode,
  TrendingUp,
  Save,
  Search
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  serverTimestamp,
  arrayUnion,
  arrayRemove 
} from 'firebase/firestore';
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

// Initialize Firebase
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
  "KP 1: Pra Nombor", "KP 2: Konsep Nombor", "KP 3: Nombor Bulat", 
  "KP 4: Tambah Lingkungan 10", "KP 5: Tolak Lingkungan 10",
  "KP 6: Tambah Lingkungan 18", "KP 7: Tolak Lingkungan 18",
  "KP 8: Tambah Lingkungan 100", "KP 9: Tolak Lingkungan 100",
  "KP 10: Darab", "KP 11: Bahagi", "KP 12: Wang & Masa"
];

// --- Components ---

// Windows XP Style Progress Bar
const RetroProgressBar = ({ progress }) => {
  return (
    <div className="w-full bg-gray-200 rounded-md p-1 border border-gray-400 shadow-inner">
      <div className="relative w-full h-6 bg-white border border-gray-300 rounded-sm overflow-hidden">
        <div 
          className="h-full bg-gradient-to-b from-green-400 via-green-500 to-green-600 relative overflow-hidden transition-all duration-500 ease-out flex items-center"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute top-0 left-0 w-full h-full animate-progress-shine opacity-30 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12"></div>
          <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqUAJIF0CdgKmEaQRAAAzDDHpX3kUzwAAAABJRU5ErkJggg==')] opacity-10"></div>
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
        .animate-progress-shine {
          animation: progress-shine 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

// Image Adjuster Component
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
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      setPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    }
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
            <img ref={imageRef} src={imageSrc} alt="Edit" className="absolute max-w-none origin-center pointer-events-none select-none" style={{ transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`, left: '50%', top: '50%' }} draggable="false" />
            <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-xl pointer-events-none"></div>
          </div>
          <div className="w-full space-y-4">
             <div className="flex items-center gap-3 text-slate-500">
               <ZoomOut size={16} />
               <input type="range" min="0.1" max="3" step="0.05" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
               <ZoomIn size={16} />
             </div>
             <p className="text-center text-xs text-slate-400">Drag to move • Pinch/Slider to zoom</p>
          </div>
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

// Full Screen Image Viewer
const ImageViewer = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200" 
      onClick={onClose}
    >
       <button 
         onClick={onClose} 
         className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
       >
         <X size={32} />
       </button>
       <img 
         src={src} 
         alt="Full Screen" 
         className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
         onClick={(e) => e.stopPropagation()} 
       />
    </div>
  );
};

const Avatar = ({ name, color, photoUrl, size = "w-12 h-12", onClick }) => {
  const commonClasses = `${size} rounded-xl shadow-sm border-2 border-white ring-1 ring-gray-100 flex-shrink-0 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`;
  
  if (photoUrl) {
    return (
      <img 
        src={photoUrl} 
        alt={name} 
        className={`${commonClasses} object-cover object-top bg-white`}
        onClick={onClick}
      />
    );
  }

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  
  return (
    <div className={`${commonClasses} flex items-center justify-center text-white font-bold shadow-sm ${color}`}>
      {initials}
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-bold text-lg text-slate-800 tracking-tight">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Helper Functions ---

const calculateSchoolYearFromIC = (ic) => {
  if (!ic) return null;
  const icStr = String(ic).replace(/\D/g, ''); 
  if (icStr.length < 2) return null;
  const yearPrefix = parseInt(icStr.substring(0, 2));
  if (isNaN(yearPrefix)) return null;
  const birthYear = 2000 + yearPrefix; 
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  return age - 6;
};

const getYearFromClassString = (className) => {
  if (!className) return null;
  const clsStr = String(className);
  const yearStr = clsStr.split(' ')[0]; 
  const yearInt = parseInt(yearStr);
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
  const gradDate = graduationDate ? new Date(graduationDate) : new Date();
  const gradYear = gradDate.getFullYear();
  const currentYear = new Date().getFullYear();
  const yearDiff = currentYear - gradYear;
  return originalYear + yearDiff;
};

const getClassColorStyle = (className) => {
  const safeClassName = String(className || 'Unknown');
  const palettes = [
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', icon: 'text-blue-600' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', icon: 'text-emerald-600' },
    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', icon: 'text-amber-600' },
    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', icon: 'text-purple-600' },
    { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', icon: 'text-rose-600' },
    { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900', icon: 'text-cyan-600' },
    { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', icon: 'text-indigo-600' },
    { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-900', icon: 'text-lime-600' },
  ];
  let hash = 0;
  for (let i = 0; i < safeClassName.length; i++) {
    hash = safeClassName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
};

const getSubjectBadgeColor = (subject) => {
  switch (subject) {
    case 'Pemulihan BM': return 'bg-blue-600';
    case 'Pemulihan Matematik': return 'bg-orange-500';
    case 'Pemulihan BM dan Matematik': return 'bg-purple-600';
    default: return 'bg-slate-500';
  }
};

const calculateLastUpdated = (studentList) => {
  if (!studentList || studentList.length === 0) return null;
  let maxDate = 0;
  studentList.forEach(student => {
    if (student.updatedAt) {
      let timestamp = 0;
      try {
        if (student.updatedAt.toDate) {
          timestamp = student.updatedAt.toDate().getTime();
        } else {
          timestamp = new Date(student.updatedAt).getTime();
        }
      } catch (e) {
        timestamp = 0;
      }
      if (!isNaN(timestamp) && timestamp > maxDate) maxDate = timestamp;
    }
  });
  if (maxDate === 0) return null;
  const date = new Date(maxDate);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return '';
  }
};

// --- Main App Component ---
export default function StudentDatabaseApp() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [role, setRole] = useState('user'); 
  const [currentSection, setCurrentSection] = useState('profile'); 
  
  const [profileYearFilter, setProfileYearFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [statsFilters, setStatsFilters] = useState({ year: 'All', gender: 'All', subject: 'All' });

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', program: 'pemulihan', className: '', subject: 'Pemulihan BM', ic: '', gender: '', mbkType: 'MBK', status: 'Active', photoUrl: '', remarks: '', docLink: '', isNewStudent: false, qrCodeUrl: ''
  });

  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null); 
  const [uploadType, setUploadType] = useState('profile');

  // Progress State
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState(null);
  const [progressSubject, setProgressSubject] = useState('BM'); // 'BM' or 'MATH'
  const [studentProgressData, setStudentProgressData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, studentId: null, studentName: '' });
  const [moveConfirmation, setMoveConfirmation] = useState({ isOpen: false, student: null, newStatus: '' });
  const [moveDate, setMoveDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedStudentForNotes, setSelectedStudentForNotes] = useState(null);
  const [noteForm, setNoteForm] = useState({ id: null, text: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.email === "admin@pemulihan.com") {
          setRole('admin');
        } else {
          setRole('user');
        }
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
        const studentList = snapshot.docs.map(doc => ({
          id: doc.id, attendanceRecords: [], notes: [], ...doc.data()
        }));
        setStudents(studentList);
        setLoading(false);
      }, (error) => { console.error("Firestore error:", error); setLoading(false); }
    );
    return () => unsubscribe();
  }, [user]);

  // --- Logic ---
  const subjects = ['Pemulihan BM', 'Pemulihan Matematik', 'Pemulihan BM dan Matematik'];
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];

  const calculateStats = (records) => {
    if (!records || records.length === 0) return { percent: 0, present: 0, total: 0 };
    const present = records.filter(r => r.status === 'present').length;
    return { percent: Math.round((present / records.length) * 100), present, total: records.length };
  };

  const handleClassNameChange = (e) => {
    let val = e.target.value.toUpperCase();
    val = val.replace(/^(\d)([A-Z])/, '$1 $2');
    setFormData({ ...formData, className: val });
  };

  const handleTabChange = (tabId) => {
    setCurrentSection(tabId);
    setProfileYearFilter('All');
    setClassFilter('All');
    setSubjectFilter('All');
    if (tabId === 'mbk') setProfileYearFilter(''); 
    // Reset Progress selection when leaving tab
    if (tabId !== 'progress') {
       setSelectedStudentForProgress(null);
       setSearchQuery('');
    }
  };

  const handleRoleSwitch = async (targetRole) => {
    if (targetRole === 'admin') {
      if (role !== 'admin') {
        setShowAdminLogin(true);
      }
    } else {
      if (role === 'admin') {
         try {
            await signOut(auth);
            setRole('user');
         } catch(e) {
            console.error("Logout failed", e);
         }
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
        console.error("Login failed", error);
    }
  };

  const handleImageUpload = (e, type = 'profile') => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image is too large. Please choose an image under 5MB."); return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
         setRawImageSrc(event.target.result);
         setUploadType(type);
      };
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
        if (type === 'profile') {
            setFormData(prev => ({ ...prev, photoUrl: '' }));
        } else {
            setFormData(prev => ({ ...prev, qrCodeUrl: '' }));
        }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user || !db) return;
    
    if (!formData.gender) {
      alert("Please select a gender (Jantina) before saving.");
      return;
    }

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    try {
      const dataToSave = {
        name: formData.name, program: formData.program, gender: formData.gender, status: formData.status,
        photoUrl: formData.photoUrl || '', updatedAt: serverTimestamp(), ic: formData.ic || '', isNewStudent: formData.isNewStudent || false
      };
      
      if (formData.program === 'pemulihan') {
        dataToSave.className = formData.className; 
        dataToSave.subject = formData.subject;
      } else {
        dataToSave.mbkType = formData.mbkType; 
        dataToSave.remarks = formData.remarks || ''; 
        dataToSave.docLink = formData.docLink || ''; 
        dataToSave.qrCodeUrl = formData.qrCodeUrl || '';
        dataToSave.className = ''; 
        dataToSave.subject = '';
      }

      if (editingId) {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', editingId);
        await updateDoc(ref, dataToSave);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), {
          ...dataToSave, attendanceRecords: [], notes: [], color: randomColor, createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false); resetForm();
    } catch (err) { console.error("Error saving:", err); }
  };
  
  const handleProgressUpdate = async () => {
    if (!user || !selectedStudentForProgress || !db) return;
    try {
       const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentForProgress.id);
       await updateDoc(ref, {
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
    
    let newSkills;
    if (currentSkills.includes(skillIndex)) {
      newSkills = currentSkills.filter(i => i !== skillIndex);
    } else {
      newSkills = [...currentSkills, skillIndex];
    }
    
    setStudentProgressData(prev => ({
      ...prev,
      [currentSubjectKey]: newSkills
    }));
  };

  const exportToExcel = () => {
    if (!students || students.length === 0) {
      alert("No data to export.");
      return;
    }

    const workbook = XLSX.utils.book_new();

    const formatStudent = (s) => ({
      Name: s.name,
      Gender: s.gender,
      IC: s.ic || '',
      Class: s.className || '',
      Subject: s.subject || '',
      Program: s.program === 'mbk' ? (s.mbkType || 'MBK') : 'Pemulihan',
      Status: s.status,
      Remarks: s.remarks || '',
      DocLink: s.docLink || '',
      LastUpdated: s.updatedAt ? new Date(s.updatedAt.toDate ? s.updatedAt.toDate() : s.updatedAt).toLocaleDateString() : ''
    });

    const profileData = students.filter(s => {
       const year = getStudentCurrentYear(s);
       return s.program === 'pemulihan' && s.status !== 'Lulus' && year <= 3;
    }).map(formatStudent);
    if(profileData.length > 0) {
      const ws = XLSX.utils.json_to_sheet(profileData);
      XLSX.utils.book_append_sheet(workbook, ws, "Profile (1-3)");
    }

    const planData = students.filter(s => {
       const year = getStudentCurrentYear(s);
       return s.program === 'pemulihan' && s.status !== 'Lulus' && year >= 4 && year <= 6;
    }).map(formatStudent);
    if(planData.length > 0) {
      const ws = XLSX.utils.json_to_sheet(planData);
      XLSX.utils.book_append_sheet(workbook, ws, "PLaN (4-6)");
    }

    const mbkData = students.filter(s => s.program === 'mbk').map(formatStudent);
    if(mbkData.length > 0) {
      const ws = XLSX.utils.json_to_sheet(mbkData);
      XLSX.utils.book_append_sheet(workbook, ws, "MBK");
    }

    const lulusData = students.filter(s => s.status === 'Lulus').map(s => ({
      ...formatStudent(s),
      GraduationDate: s.graduationDate || ''
    }));
    if(lulusData.length > 0) {
      const ws = XLSX.utils.json_to_sheet(lulusData);
      XLSX.utils.book_append_sheet(workbook, ws, "Lulus");
    }

    XLSX.writeFile(workbook, "Student_Database.xlsx");
  };

  const confirmDelete = (student) => {
    if (!user || role !== 'admin') return;
    setDeleteConfirmation({ isOpen: true, studentId: student.id, studentName: student.name });
  };

  const executeDelete = async () => {
    const id = deleteConfirmation.studentId;
    if (!user || role !== 'admin' || !id || !db) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', id));
      setDeleteConfirmation({ isOpen: false, studentId: null, studentName: '' });
    } catch (err) { console.error("Error deleting:", err); }
  };

  const openAttendanceModal = (student) => {
    setSelectedStudentForAttendance(student);
    setAttendanceDate(new Date().toISOString().split('T')[0]);
    setIsAttendanceModalOpen(true);
  };

  const markAttendance = async (status, date) => {
    if (!user || !selectedStudentForAttendance || !db) return;
    const newRecord = { date: date || attendanceDate, status: status, timestamp: Date.now() };
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
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentForAttendance.id);
      await updateDoc(ref, { attendanceRecords: arrayRemove(record) });
    } catch (err) { console.error("Error deleting record:", err); }
  };

  const openNotesModal = (student) => {
    setSelectedStudentForNotes(student);
    setNoteForm({ id: null, text: '', date: new Date().toISOString().split('T')[0] });
    setIsNotesModalOpen(true);
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
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentForNotes.id);
    const newNotes = (selectedStudentForNotes.notes || []).filter(n => n.id !== noteId);
    try { await updateDoc(ref, { notes: newNotes }); } catch (err) { console.error("Error deleting note:", err); }
  };

  const startEditNote = (note) => setNoteForm({ id: note.id, text: note.text, date: note.date });

  const handleCheckOKU = (ic) => {
    if (!ic) return;
    const textArea = document.createElement("textarea");
    textArea.value = ic; document.body.appendChild(textArea); textArea.select();
    try { document.execCommand('copy'); } catch (err) { console.error('Copy failed', err); }
    document.body.removeChild(textArea);
    window.open('https://oku.jkm.gov.my/semakan_oku', '_blank');
  };

  const toggleStudentStatus = (student) => {
    if (!user || role !== 'admin') return;
    const newStatus = student.status === 'Lulus' ? 'Active' : 'Lulus';
    setMoveDate(new Date().toISOString().split('T')[0]);
    setMoveConfirmation({ isOpen: true, student: student, newStatus: newStatus });
  };

  const executeMove = async () => {
    const { student, newStatus } = moveConfirmation;
    if (!user || role !== 'admin' || !student || !db) return;
    try {
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', student.id);
      const updates = { status: newStatus };
      if (newStatus === 'Lulus') updates.graduationDate = moveDate; else updates.graduationDate = null;
      await updateDoc(ref, updates);
      setMoveConfirmation({ isOpen: false, student: null, newStatus: '' });
    } catch (err) { console.error("Error updating status:", err); }
  };

  const openEdit = (student) => {
    setEditingId(student.id);
    setFormData({
      name: student.name, program: student.program || 'pemulihan', className: student.className || '',
      subject: student.subject || 'Pemulihan BM', ic: student.ic || '', gender: student.gender || '',
      mbkType: student.mbkType || 'MBK', status: student.status || 'Active', photoUrl: student.photoUrl || '',
      remarks: student.remarks || '', docLink: student.docLink || '', isNewStudent: student.isNewStudent || false, qrCodeUrl: student.qrCodeUrl || ''
    });
    setIsModalOpen(true);
  };

  const openAdd = () => {
    resetForm();
    if (currentSection === 'mbk') setFormData(prev => ({ ...prev, program: 'mbk' }));
    else setFormData(prev => ({ ...prev, program: 'pemulihan' }));
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', program: 'pemulihan', className: '', subject: 'Pemulihan BM', ic: '', gender: '', mbkType: 'MBK', status: 'Active', photoUrl: '', remarks: '', docLink: '', isNewStudent: false, qrCodeUrl: '' });
  };

  // --- Filtering & Derived State ---
  
  const availableYears = useMemo(() => {
    const pemulihanStudents = students.filter(s => (!s.program || s.program === 'pemulihan'));
    const years = new Set(pemulihanStudents.map(s => getYearFromClassString(s.className)));
    return ['All', ...Array.from(years).sort()];
  }, [students]);

  const availableClasses = useMemo(() => {
    const pemulihanStudents = students.filter(s => (!s.program || s.program === 'pemulihan'));
    const classes = new Set(pemulihanStudents.map(s => s.className).filter(Boolean));
    return ['All', ...Array.from(classes).sort()];
  }, [students]);

  const groupedProfileStudents = useMemo(() => {
    if (currentSection !== 'profile') return {};
    const profileStudents = students.filter(s => {
      const program = s.program || 'pemulihan';
      if (program !== 'pemulihan') return false; 
      if (s.status === 'Lulus') return false;
      const studentYear = getStudentCurrentYear(s);
      if (studentYear > 3) return false;
      const matchesYear = profileYearFilter === 'All' || studentYear === parseInt(profileYearFilter);
      const matchesClass = classFilter === 'All' || s.className === classFilter;
      const matchesSubject = subjectFilter === 'All' || s.subject === subjectFilter;
      return matchesYear && matchesClass && matchesSubject;
    });
    const groups = {};
    profileStudents.forEach(student => {
      const cls = student.className || 'No Class';
      if (!groups[cls]) groups[cls] = [];
      groups[cls].push(student);
    });
    return groups;
  }, [students, currentSection, profileYearFilter, classFilter, subjectFilter]);

  const groupedPlanStudents = useMemo(() => {
    if (currentSection !== 'plan') return {};

    const planStudents = students.filter(s => {
      const program = s.program || 'pemulihan';
      if (program !== 'pemulihan') return false;
      if (s.status === 'Lulus') return false;

      const studentYear = getStudentCurrentYear(s);
      if (studentYear < 4 || studentYear > 6) return false;

      return true; 
    });

    const groups = {};
    planStudents.forEach(student => {
      const year = getStudentCurrentYear(student);
      const groupKey = `Tahun ${year}`;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(student);
    });
    return groups;
  }, [students, currentSection]);

  const groupedLulusStudents = useMemo(() => {
    if (currentSection !== 'lulus') return {};
    const groups = {};
    const lulusStudents = students.filter(s => s.status === 'Lulus' && (!s.program || s.program === 'pemulihan'));
    lulusStudents.forEach(student => {
      const currentYearNum = calculateCurrentLulusYear(student.className, student.graduationDate);
      const groupKey = `Tahun ${currentYearNum}`;
      if (!groups[groupKey]) groups[groupKey] = { yearNum: currentYearNum, students: [] };
      groups[groupKey].students.push(student);
    });
    return groups;
  }, [students, currentSection]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const program = s.program || 'pemulihan';

      if (currentSection === 'mbk') {
        if (program !== 'mbk') return false;
        const schoolYear = calculateSchoolYearFromIC(s.ic); 
        if (schoolYear !== null && schoolYear > 6) return false; 
        // Allow basic search filtering on MBK tab too
        return s.name.toLowerCase().includes(profileYearFilter === 'All' || profileYearFilter === '' ? '' : profileYearFilter.toLowerCase());
      }
      
      if (currentSection === 'progress') {
         if (s.program !== 'pemulihan' || s.status === 'Lulus') return false;
         const studentYear = getStudentCurrentYear(s);
         if (studentYear > 3) return false; // Filter out PLaN (Yr 4-6)
         
         if (searchQuery) return s.name.toLowerCase().includes(searchQuery.toLowerCase());
         return true;
      }

      if (currentSection === 'stats') {
        if (program === 'mbk') return false;
        if (s.status === 'Lulus') return false;
        
        const studentYearCalc = getStudentCurrentYear(s);
        if (studentYearCalc > 3) return false;

        const studentYear = getYearFromClassString(s.className);
        const filterYear = parseInt(statsFilters.year);
        const matchYear = statsFilters.year === 'All' || (studentYear !== null && studentYear === filterYear);
        const matchGender = statsFilters.gender === 'All' || s.gender === statsFilters.gender;
        const matchSubject = statsFilters.subject === 'All' || s.subject === statsFilters.subject;
        return matchYear && matchGender && matchSubject;
      }
      return false;
    });
  }, [students, profileYearFilter, subjectFilter, currentSection, statsFilters, searchQuery]);

  const lastUpdatedString = useMemo(() => {
    let list = [];
    if (currentSection === 'profile') {
       Object.values(groupedProfileStudents).forEach(group => list = [...list, ...group]);
    } else if (currentSection === 'plan') {
       Object.values(groupedPlanStudents).forEach(group => list = [...list, ...group]);
    } else if (currentSection === 'lulus') {
       Object.values(groupedLulusStudents).forEach(group => list = [...list, ...group.students]);
    } else {
       list = filteredStudents;
    }
    return calculateLastUpdated(list);
  }, [currentSection, groupedProfileStudents, groupedPlanStudents, groupedLulusStudents, filteredStudents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 font-sans selection:bg-indigo-100 pb-24">
      {/* Navbar - same */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-md shadow-indigo-200">
                <GraduationCap className="text-white h-6 w-6" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">
                Profile Murid <span className="text-indigo-600">Digital</span>
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-slate-100/80 backdrop-blur-sm rounded-full p-1 flex items-center text-xs font-bold shadow-inner">
                <button onClick={() => handleRoleSwitch('admin')} className={`px-4 py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 ${role === 'admin' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                  {role === 'admin' && <Shield size={12} className="text-indigo-500" />}
                  Admin
                </button>
                <button onClick={() => handleRoleSwitch('user')} className={`px-4 py-1.5 rounded-full transition-all duration-300 ${role === 'user' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                  User
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex justify-center mb-8">
          <div className="w-full overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 flex sm:justify-center">
            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 gap-1 min-w-max">
            {[{ id: 'profile', label: 'Profile Pemulihan' }, { id: 'plan', label: 'PLaN' }, { id: 'mbk', label: 'Murid MBK & OKU' }, { id: 'lulus', label: 'Lulus' }, { id: 'stats', label: 'Statistik' }, { id: 'progress', label: 'Progress' }].map(tab => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 whitespace-nowrap ${currentSection === tab.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>{tab.label}</button>
            ))}
          </div>
          </div>
        </div>

        {/* PROGRESS TAB */}
        {currentSection === 'progress' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {selectedStudentForProgress ? (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                 {/* Student Header */}
                 <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar name={selectedStudentForProgress.name} color={selectedStudentForProgress.color} photoUrl={selectedStudentForProgress.photoUrl} size="w-20 h-20" />
                      <div>
                        <h3 className="font-bold text-xl text-slate-900">{selectedStudentForProgress.name}</h3>
                        <p className="text-sm text-slate-500 mb-1">{selectedStudentForProgress.className}</p>
                        <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm ${getSubjectBadgeColor(selectedStudentForProgress.subject)}`}>
                          {selectedStudentForProgress.subject}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedStudentForProgress(null)} className="px-4 py-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 text-sm font-bold shadow-sm">Change Student</button>
                 </div>
                 
                 {/* Subject Toggle - Conditional */}
                 <div className="flex border-b border-slate-200">
                    {(selectedStudentForProgress.subject === 'Pemulihan BM' || selectedStudentForProgress.subject === 'Pemulihan BM dan Matematik') && (
                      <button onClick={() => setProgressSubject('BM')} className={`flex-1 py-4 text-center font-bold text-sm ${progressSubject === 'BM' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Bahasa Melayu</button>
                    )}
                    {(selectedStudentForProgress.subject === 'Pemulihan Matematik' || selectedStudentForProgress.subject === 'Pemulihan BM dan Matematik') && (
                      <button onClick={() => setProgressSubject('MATH')} className={`flex-1 py-4 text-center font-bold text-sm ${progressSubject === 'MATH' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Matematik</button>
                    )}
                 </div>

                 {/* Progress Content */}
                 <div className="p-6 md:p-8">
                    {/* Progress Bar */}
                    <div className="mb-8">
                       <div className="flex justify-between items-end mb-2">
                         <h4 className="font-bold text-lg text-slate-800">Overall Progress</h4>
                         <span className="text-sm font-bold text-slate-500">
                           {studentProgressData[progressSubject === 'BM' ? 'bm' : 'math']?.length || 0} / {progressSubject === 'BM' ? KEMAHIRAN_BM.length : KEMAHIRAN_MATH.length}
                         </span>
                       </div>
                       <RetroProgressBar 
                          progress={
                            ((studentProgressData[progressSubject === 'BM' ? 'bm' : 'math']?.length || 0) / 
                            (progressSubject === 'BM' ? KEMAHIRAN_BM.length : KEMAHIRAN_MATH.length)) * 100
                          } 
                       />
                    </div>

                    {/* Skills Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                       {(progressSubject === 'BM' ? KEMAHIRAN_BM : KEMAHIRAN_MATH).map((skill, index) => {
                          const skillIndex = index + 1;
                          const subjectKey = progressSubject === 'BM' ? 'bm' : 'math';
                          const isCompleted = studentProgressData[subjectKey]?.includes(skillIndex);
                          
                          return (
                            <div 
                              key={index} 
                              onClick={() => { if(role === 'admin') toggleSkill(skillIndex); }}
                              className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all duration-200 ${isCompleted ? (progressSubject === 'BM' ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-emerald-50 border-emerald-200 shadow-sm') : 'bg-white border-slate-100 hover:border-slate-300'}`}
                            >
                               <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${isCompleted ? (progressSubject === 'BM' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-emerald-600 border-emerald-600 text-white') : 'bg-white border-slate-300'}`}>
                                  {isCompleted && <Check size={16} strokeWidth={3} />}
                               </div>
                               <span className={`text-sm font-medium ${isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>{skill}</span>
                            </div>
                          );
                       })}
                    </div>
                    
                    {role === 'admin' && (
                      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                         <button onClick={handleProgressUpdate} className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95">
                           <Save size={18} /> Save Progress
                         </button>
                      </div>
                    )}
                 </div>
               </div>
             ) : (
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                      <TrendingUp className="text-indigo-600 w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Student Progress Tracker</h2>
                    <p className="text-slate-500 mb-8">Select a student from the list below to view or update their mastery of skills (Kemahiran).</p>
                    
                    <div className="relative mb-6">
                      <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                      <input 
                        type="text" 
                        placeholder="Search student name..." 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                       {filteredStudents.map(student => (
                         <button 
                           key={student.id}
                           onClick={() => {
                              setSelectedStudentForProgress(student);
                              setStudentProgressData(student.progress || { bm: [], math: [] });
                              // Set default subject tab
                              if (student.subject === 'Pemulihan Matematik') {
                                setProgressSubject('MATH');
                              } else {
                                setProgressSubject('BM');
                              }
                           }}
                           className="w-full flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all text-left group"
                         >
                            <Avatar name={student.name} color={student.color} photoUrl={student.photoUrl} size="w-10 h-10" />
                            <div>
                               <h4 className="font-bold text-slate-800 group-hover:text-indigo-700">{student.name}</h4>
                               <p className="text-xs text-slate-500">{student.className}</p>
                            </div>
                            <ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-indigo-400" />
                         </button>
                       ))}
                       {filteredStudents.length === 0 && <p className="text-slate-400 text-sm py-4">No students found matching your search.</p>}
                    </div>
                  </div>
               </div>
             )}
           </div>
        )}

        {/* STATS VIEW */}
        {currentSection === 'stats' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Filter size={20} className="text-indigo-500" /> Find Database
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* ... filters ... */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Year (Tahun)</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium appearance-none" value={statsFilters.year} onChange={(e) => setStatsFilters(prev => ({...prev, year: e.target.value}))}>
                    {availableYears.map(y => <option key={y} value={y}>{y === 'All' ? 'Semua Tahun' : `Tahun ${y}`}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-9 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Gender</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium appearance-none" value={statsFilters.gender} onChange={(e) => setStatsFilters(prev => ({...prev, gender: e.target.value}))}>
                    <option value="All">Semua Jantina</option>
                    <option value="Lelaki">Lelaki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-9 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Subject</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium appearance-none" value={statsFilters.subject} onChange={(e) => setStatsFilters(prev => ({...prev, subject: e.target.value}))}>
                    <option value="All">Semua Subjek</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-9 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="bg-orange-50 p-8 rounded-2xl border border-orange-100 flex items-center justify-between shadow-sm">
              <div>
                 <p className="text-sm text-orange-600 font-bold uppercase tracking-wider">Students Found (Pemulihan Only)</p>
                 <h2 className="text-5xl font-extrabold text-orange-900 mt-1 tracking-tight">{filteredStudents.length}</h2>
              </div>
              <div className="bg-orange-100 p-4 rounded-2xl">
                <PieChart className="text-orange-500 w-12 h-12" />
              </div>
            </div>
            {filteredStudents.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-600">Name</th>
                      <th className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-600">Gender</th>
                      <th className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-600">Class</th>
                      <th className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-600">Subject</th>
                      <th className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-800">{student.name}</td>
                        <td className="px-4 py-3 md:px-6 md:py-4 text-slate-500">{student.gender || 'Lelaki'}</td>
                        <td className="px-4 py-3 md:px-6 md:py-4 text-slate-500 font-mono text-xs">
                          <span className="bg-slate-100 rounded px-2 py-1">{student.className}</span>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4 text-slate-500">{student.subject}</td>
                         <td className="px-4 py-3 md:px-6 md:py-4">
                           <span className={`px-3 py-1 rounded-full text-xs font-bold ${student.status === 'Lulus' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                             {student.status || 'Active'}
                           </span>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        )}

        {currentSection === 'mbk' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h2 className="text-2xl font-extrabold text-indigo-900 tracking-tight">Senarai Murid MBK</h2>
              <div className="flex gap-3 w-full md:w-auto items-center">
                 {lastUpdatedString && (
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-50 px-3 py-1.5 rounded-lg hidden md:inline-block">
                    Last updated: {lastUpdatedString}
                  </span>
                )}
                {role === 'admin' && (
                  <button onClick={openAdd} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 font-bold text-sm">
                    <Plus size={18} strokeWidth={2.5} /> Add Student
                  </button>
                )}
                <button onClick={exportToExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-indigo-600 font-bold bg-white px-5 py-2.5 border border-slate-200 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all">
                  <Download size={18} /> Export Excel
                </button>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600 mx-auto mb-4"></div><p className="text-slate-400 font-medium">Loading database...</p></div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
                <div className="bg-slate-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"><Accessibility className="text-slate-300 w-10 h-10" /></div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No MBK students found</h3>
                <p className="text-slate-500">Currently showing Year 1 to Year 6 only.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredStudents.map(student => {
                  const year = calculateSchoolYearFromIC(student.ic);
                  return (
                  <div key={student.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-slate-200 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden flex flex-col">
                    
                    {/* Desktop View */}
                    <div className="hidden sm:flex flex-col items-center p-6 gap-4">
                      <Avatar name={student.name} color={student.color || 'bg-indigo-500'} photoUrl={student.photoUrl} size="w-24 h-24" onClick={() => { if(student.photoUrl) setFullScreenImage(student.photoUrl); }}/>
                      <div className="text-center">
                        <h3 className="font-bold text-lg text-slate-900 leading-tight mb-2">{student.name}</h3>
                        <div className="flex items-center justify-center gap-2 mb-3"><CreditCard size={16} className="text-slate-400" /><span className="font-bold text-slate-700 tracking-wide font-mono">{student.ic}</span></div>
                        <div className="space-y-2">
                          <div className="bg-indigo-50 p-2 rounded-lg text-sm font-medium text-indigo-900">{year < 1 ? 'Pra-sekolah' : `Tahun ${year}`}</div>
                          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 font-medium">
                            {student.gender} • <span className={`px-2 py-0.5 rounded text-xs font-bold ${student.mbkType === 'OKU' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{student.mbkType || 'MBK'}</span>
                          </div>
                        </div>
                      </div>
                      
                       {/* Remarks Section */}
                       {student.remarks && (
                        <div className="w-full mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 text-left">
                          <MessageSquare size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-slate-700 italic">{student.remarks}</p>
                        </div>
                      )}

                       <div className="mt-2 w-full pt-4 border-t border-slate-100 flex gap-2">
                        <button onClick={() => window.open(student.docLink, '_blank')} disabled={!student.docLink} className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white py-2.5 rounded-xl transition-all shadow-sm active:scale-95 ${student.docLink ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200' : 'bg-slate-300 cursor-not-allowed'}`} title={student.docLink ? 'Open Document' : 'No document linked'}>
                          <FileText size={16} /> Documents
                        </button>
                      </div>

                      {role === 'admin' && (
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(student)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                            <button onClick={() => confirmDelete(student)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>

                    {/* Mobile View - Compact Side by Side */}
                    <div className="sm:hidden flex flex-row items-start p-3 gap-3 relative z-10">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                      <div className="flex flex-col items-center gap-2">
                        <Avatar name={student.name} color={student.color || 'bg-indigo-500'} photoUrl={student.photoUrl} size="w-16 h-16" onClick={() => { if(student.photoUrl) setFullScreenImage(student.photoUrl); }}/>
                        
                        {role === 'admin' && (
                           <div className="grid grid-cols-2 gap-1 w-[70px]">
                              <button onClick={() => openNotesModal(student)} className="p-1 text-amber-500 bg-amber-50 rounded border border-amber-100 shadow-sm flex items-center justify-center"><StickyNote size={12} /></button>
                              <button onClick={() => openEdit(student)} className="p-1 text-slate-500 bg-slate-50 rounded border border-slate-100 shadow-sm flex items-center justify-center"><Edit2 size={12} /></button>
                              <button onClick={() => confirmDelete(student)} className="p-1 text-red-500 bg-red-50 rounded border border-red-100 shadow-sm flex items-center justify-center col-span-2"><Trash2 size={12} /></button>
                           </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 text-left">
                        <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1 break-words">{student.name}</h3>
                        <div className="text-xs font-medium text-slate-600 mb-0.5">{year < 1 ? 'Pra-sekolah' : `Tahun ${year}`}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                          {student.gender || 'Lelaki'}
                          <span className={`px-1.5 py-0.5 rounded border text-[9px] ${student.mbkType === 'OKU' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{student.mbkType || 'MBK'}</span>
                        </div>
                        
                        {/* Remarks Section Compact */}
                        {student.remarks && (
                           <div className="text-[10px] text-slate-500 italic bg-yellow-50 px-2 py-1 rounded border border-yellow-100 flex items-start gap-1 mt-1">
                              <MessageSquare size={10} className="mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{student.remarks}</span>
                           </div>
                        )}

                        <div className="mt-2 flex flex-col gap-1">
                           <button onClick={() => window.open(student.docLink, '_blank')} disabled={!student.docLink} className={`flex items-center justify-center gap-1 text-[10px] font-bold py-1 px-2 rounded transition-all border ${student.docLink ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'}`} title={student.docLink ? 'Open Document' : 'No document linked'}>
                             <FileText size={12} /> {student.docLink ? 'Docs' : 'No Docs'}
                           </button>
                           {student.qrCodeUrl && (
                             <button onClick={() => setFullScreenImage(student.qrCodeUrl)} className="flex items-center justify-center gap-1 text-[10px] font-bold py-1 px-2 rounded transition-all border bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100">
                               <QrCode size={12} /> QR
                             </button>
                           )}
                        </div>
                      </div>

                      {role === 'admin' && (
                        <div className="hidden sm:flex absolute top-2 right-2 flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg backdrop-blur-sm shadow-sm">
                           <button onClick={() => openEdit(student)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors"><Edit2 size={14} /></button>
                           <button onClick={() => confirmDelete(student)} className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                    
                    {student.isNewStudent && (
                      <div className="absolute top-2 left-3 sm:top-2 sm:left-2 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse z-20 flex items-center gap-0.5">
                        <Sparkles size={8} /> NEW
                      </div>
                    )}
                  </div>
                )})}
              </div>
            )}
          </div>
        )}

        {/* LULUS VIEW */}
        {currentSection === 'lulus' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-extrabold text-purple-900 tracking-tight">Graduates (Lulus)</h2>
              <div className="flex gap-2 items-center">
                {lastUpdatedString && (
                  <span className="text-xs font-bold text-purple-400 bg-purple-50 px-3 py-1.5 rounded-lg hidden md:inline-block">
                    Last updated: {lastUpdatedString}
                  </span>
                )}
                <button onClick={exportToExcel} className="flex items-center gap-2 text-sm text-slate-600 hover:text-purple-600 font-bold bg-white px-5 py-2.5 border border-slate-200 rounded-xl hover:border-purple-200 hover:shadow-md transition-all"><Download size={18} /> Export Excel</button>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-100 border-t-purple-600 mx-auto mb-4"></div><p className="text-slate-400 font-medium">Loading...</p></div>
            ) : Object.keys(groupedLulusStudents).length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300"><div className="bg-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"><CheckCircle className="text-purple-300 w-10 h-10" /></div><h3 className="text-xl font-bold text-slate-900 mb-2">No graduates yet</h3><p className="text-slate-500">Students marked as 'Lulus' will appear here.</p></div>
            ) : (
              <div className="space-y-10">
                {Object.keys(groupedLulusStudents).sort().map(groupKey => (
                  <div key={groupKey} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-purple-50/50 px-8 py-4 border-b border-purple-100 flex items-center justify-between backdrop-blur-sm">
                      <h3 className="font-extrabold text-purple-900 text-lg flex items-center gap-2"><Calendar className="text-purple-500" size={20} />{groupKey}</h3>
                      <span className="text-xs font-bold bg-white text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100 shadow-sm">{groupedLulusStudents[groupKey].students.length} Students</span>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groupedLulusStudents[groupKey].students.map(student => (
                        <div key={student.id} className="bg-white border border-slate-300 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden flex flex-col">
                          {/* Desktop View */}
                          <div className="hidden sm:block">
                              <div className="flex items-center gap-4 mb-4">
                                <Avatar name={student.name} color={student.color} photoUrl={student.photoUrl} size="w-16 h-16" onClick={() => { if(student.photoUrl) setFullScreenImage(student.photoUrl); }}/>
                                <div><h4 className="font-bold text-slate-900 text-base leading-tight mb-1">{student.name}</h4><span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{student.gender}</span></div>
                              </div>
                              <div className="mt-auto pt-4 border-t border-slate-50 flex flex-col gap-2">
                                 <div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-400 uppercase tracking-wider">Subject</span><span className="font-semibold text-slate-700 text-right">{student.subject}</span></div>
                                 <div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-400 uppercase tracking-wider">Graduated</span><span className="font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">{student.graduationDate}</span></div>
                              </div>
                              {role === 'admin' && (
                                <div className="hidden sm:flex absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg backdrop-blur-sm shadow-sm">
                                    <button onClick={() => toggleStudentStatus(student)} className="p-1.5 text-slate-400 hover:text-purple-600 transition-colors" title="Revert"><RotateCcw size={16} /></button>
                                    <button onClick={() => confirmDelete(student)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={16} /></button>
                                    <button onClick={() => openEdit(student)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="Edit"><Edit2 size={16} /></button>
                                </div>
                              )}
                          </div>

                          {/* Mobile View - Compact Side by Side */}
                          <div className="sm:hidden flex flex-row items-start p-3 gap-3 relative z-10">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-purple-400 to-purple-600"></div>
                            
                            <div className="flex flex-col items-center gap-2">
                                <Avatar name={student.name} color={student.color} photoUrl={student.photoUrl} size="w-16 h-16" onClick={() => { if(student.photoUrl) setFullScreenImage(student.photoUrl); }}/>
                                {/* Mobile Admin Buttons - 2 Cols */}
                                {role === 'admin' && (
                                    <div className="grid grid-cols-2 gap-1 w-[70px]">
                                       <button onClick={() => openEdit(student)} className="p-1 text-slate-500 bg-slate-50 rounded border border-slate-100 shadow-sm flex items-center justify-center"><Edit2 size={12} /></button>
                                       <button onClick={() => toggleStudentStatus(student)} className="p-1 text-purple-500 bg-purple-50 rounded border border-purple-100 shadow-sm flex items-center justify-center"><RotateCcw size={12} /></button>
                                       <button onClick={() => confirmDelete(student)} className="p-1 text-red-500 bg-red-50 rounded border border-red-100 shadow-sm flex items-center justify-center col-span-2"><Trash2 size={12} /></button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0 text-left">
                                <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1 break-words">{student.name}</h3>
                                <div className="text-xs font-medium text-slate-600 mb-0.5">{student.subject}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{student.gender}</div>
                                <div className="text-[10px] text-purple-600 font-semibold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 inline-block">Graduated: {student.graduationDate}</div>
                            </div>
                          </div>
                          
                           {student.isNewStudent && (
                            <div className="absolute top-2 left-3 sm:top-2 sm:left-2 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse z-20 flex items-center gap-0.5">
                              <span className="w-1.5 h-1.5 bg-white rounded-full"></span> NEW
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {currentSection === 'plan' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight">PLaN (Thn 4-6)</h2>
              <div className="flex gap-2 items-center">
                 {lastUpdatedString && (
                  <span className="text-xs font-bold text-blue-400 bg-blue-50 px-3 py-1.5 rounded-lg hidden md:inline-block">
                    Last updated: {lastUpdatedString}
                  </span>
                )}
                <button onClick={exportToExcel} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 font-bold bg-white px-5 py-2.5 border border-slate-200 rounded-xl hover:border-blue-200 hover:shadow-md transition-all"><Download size={18} /> Export Excel</button>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mx-auto mb-4"></div><p className="text-slate-400 font-medium">Loading...</p></div>
            ) : Object.keys(groupedPlanStudents).length === 0 ? (
               <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300"><div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"><BookOpenCheck className="text-blue-300 w-10 h-10" /></div><h3 className="text-xl font-bold text-slate-900 mb-2">No PLaN students</h3><p className="text-slate-500">Students in Year 4, 5, and 6 appear here automatically.</p></div>
            ) : (
               <div className="space-y-10">
                {Object.keys(groupedPlanStudents).sort().map(groupKey => (
                   <div key={groupKey} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-blue-50/50 px-8 py-4 border-b border-blue-100 flex items-center justify-between backdrop-blur-sm">
                      <h3 className="font-extrabold text-blue-900 text-lg flex items-center gap-2"><BookOpenCheck className="text-blue-500" size={20} />{groupKey}</h3>
                      <span className="text-xs font-bold bg-white text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">{groupedPlanStudents[groupKey].length} Students</span>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                       {groupedPlanStudents[groupKey].map(student => (
                         <div key={student.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-slate-100 transition-all duration-300 hover:-translate-y-1 flex flex-col relative group">
                           {/* Desktop View */}
                           <div className="hidden sm:flex flex-col items-center p-5 gap-4">
                             <Avatar name={student.name} color={student.color} photoUrl={student.photoUrl} size="w-16 h-16" onClick={() => { if(student.photoUrl) setFullScreenImage(student.photoUrl); }}/>
                             <div className="text-center">
                                <h4 className="font-bold text-slate-900 text-base leading-tight mb-1">{student.name}</h4>
                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{student.gender}</span>
                             </div>
                             <div className="mt-auto pt-4 border-t border-slate-50 flex flex-col gap-2 w-full">
                                <div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-400 uppercase tracking-wider">Subject</span><span className="font-semibold text-slate-700 text-right">{student.subject}</span></div>
                             </div>

                             {role === 'admin' && (
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg backdrop-blur-sm shadow-sm">
                                   <button onClick={() => openNotesModal(student)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded transition-colors"><StickyNote size={16} /></button>
                                   <button onClick={() => confirmDelete(student)} className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                                   <button onClick={() => openEdit(student)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors"><Edit2 size={16} /></button>
                                </div>
                             )}
                           </div>

                           {/* Mobile View - Compact Side by Side */}
                           <div className="sm:hidden flex flex-row items-start p-3 gap-3 relative z-10">
                             <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-400 to-blue-600"></div>
                             
                             <div className="flex flex-col items-center gap-2">
                                <Avatar name={student.name} color={student.color} photoUrl={student.photoUrl} size="w-16 h-16" onClick={() => { if(student.photoUrl) setFullScreenImage(student.photoUrl); }}/>
                                {/* Mobile Admin Buttons - 2 Cols under Avatar */}
                                {role === 'admin' && (
                                    <div className="grid grid-cols-2 gap-1 w-[70px]">
                                       <button onClick={() => openNotesModal(student)} className="p-1 text-amber-500 bg-amber-50 rounded border border-amber-100 shadow-sm flex items-center justify-center"><StickyNote size={12} /></button>
                                       <button onClick={() => openEdit(student)} className="p-1 text-slate-500 bg-slate-50 rounded border border-slate-100 shadow-sm flex items-center justify-center"><Edit2 size={12} /></button>
                                       <button onClick={() => confirmDelete(student)} className="p-1 text-red-500 bg-red-50 rounded border border-red-100 shadow-sm flex items-center justify-center col-span-2"><Trash2 size={12} /></button>
                                    </div>
                                )}
                             </div>
                             
                             <div className="flex-1 min-w-0 text-left">
                                <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1 break-words">{student.name}</h3>
                                <div className="text-xs font-medium text-slate-600 mb-0.5">{student.subject}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{student.gender}</div>
                             </div>
                           </div>
                            
                           {student.isNewStudent && (
                            <div className="absolute top-2 left-3 sm:top-2 sm:right-2 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse z-20 flex items-center gap-0.5">
                              <span className="w-1.5 h-1.5 bg-white rounded-full"></span> NEW
                            </div>
                          )}
                         </div>
                       ))}
                    </div>
                   </div>
                ))}
               </div>
            )}
          </div>
        )}

        {currentSection === 'profile' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row gap-4 mb-8 justify-between items-start lg:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative group">
                  <select className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-bold text-sm appearance-none transition-colors hover:bg-slate-100 cursor-pointer" value={profileYearFilter} onChange={(e) => setProfileYearFilter(e.target.value)}>
                    {availableYears.map(y => <option key={y} value={y}>{y === 'All' ? 'Find: All Years' : `Tahun ${y}`}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none group-hover:text-slate-600" />
                </div>
                <div className="relative group">
                  <select className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-bold text-sm appearance-none transition-colors hover:bg-slate-100 cursor-pointer" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                    {availableClasses.map(c => <option key={c} value={c}>{c === 'All' ? 'Find: All Classes' : c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none group-hover:text-slate-600" />
                </div>
                <div className="relative group">
                  <select className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-bold text-sm appearance-none transition-colors hover:bg-slate-100 cursor-pointer" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none group-hover:text-slate-600" />
                </div>
              </div>

              <div className="flex gap-3 w-full lg:w-auto items-center">
                 {lastUpdatedString && (
                  <span className="text-xs font-bold text-blue-400 bg-blue-50 px-3 py-1.5 rounded-lg hidden lg:inline-block whitespace-nowrap">
                    <RefreshCw size={10} className="inline mr-1"/> {lastUpdatedString}
                  </span>
                )}
                {role === 'admin' && currentSection === 'profile' && (
                  <button onClick={openAdd} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-5 py-2.5 rounded-xl shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5 font-bold text-sm"><Plus size={18} strokeWidth={2.5} /> Add Student</button>
                )}
                <button onClick={exportToExcel} className="flex-1 lg:flex-none flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-blue-600 font-bold bg-white px-5 py-2.5 border border-slate-200 rounded-xl hover:border-blue-200 hover:shadow-md transition-all"><Download size={18} /> Export Excel</button>
              </div>
            </div>

            {/* Student Groups */}
            {loading ? (
              <div className="text-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mx-auto mb-4"></div><p className="text-slate-400 font-medium">Loading database...</p></div>
            ) : Object.keys(groupedProfileStudents).length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm"><div className="bg-slate-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"><Users className="text-slate-300 w-10 h-10" /></div><h3 className="text-xl font-bold text-slate-900 mb-2">No students found</h3><p className="text-slate-500">Try adjusting your filters.</p></div>
            ) : (
              <div className="space-y-10">
                {Object.keys(groupedProfileStudents).sort().map(className => {
                  const style = getClassColorStyle(className);
                  return (
                  <div key={className} className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm`}>
                    <div className={`px-8 py-4 border-b ${style.border} flex items-center justify-between bg-white`}>
                      <h3 className={`font-extrabold ${style.text} text-lg flex items-center gap-3`}><div className={`bg-white p-2 rounded-lg shadow-sm border ${style.border}`}><School className={style.icon} size={20} /></div>{className}</h3>
                      <span className={`text-xs font-bold bg-white ${style.icon} px-3 py-1.5 rounded-lg border ${style.border} shadow-sm`}>{groupedProfileStudents[className].length} Students</span>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                      {groupedProfileStudents[className].map(student => {
                        const studentStats = calculateStats(student.attendanceRecords || []);
                        return (
                        <div key={student.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-slate-300 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden flex flex-col">
                          
                          {/* Desktop View (Vertical Card) */}
                          <div className="hidden sm:flex flex-col items-center p-3 gap-4">
                              <Avatar name={student.name} color={student.color || 'bg-blue-500'} photoUrl={student.photoUrl} size="w-20 h-20" onClick={() => { if(student.photoUrl) setFullScreenImage(student.photoUrl); }}/>
                              
                              <div className="w-full text-center">
                                <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1">{student.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">{student.gender || 'Lelaki'}</p>
                                
                                <div className={`inline-block items-center justify-center text-[10px] font-bold text-white px-2 py-0.5 rounded-md uppercase tracking-wide mb-2 shadow-sm ${getSubjectBadgeColor(student.subject)}`}>{student.subject}</div>

                                <div className="flex flex-col gap-1 w-full">
                                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                                    <span>Attendance</span>
                                    <span className={studentStats.percent >= 75 ? 'text-emerald-600' : 'text-amber-600'}>{studentStats.percent}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"><div className={`h-full rounded-full ${studentStats.percent >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${studentStats.percent}%` }}></div></div>
                                </div>
                              </div>
                              
                              <div className="mt-2 text-[10px] text-slate-400 text-center font-medium">
                                Updated: {student.updatedAt ? formatDate(student.updatedAt) : 'New'}
                              </div>

                              {role === 'admin' && (
                                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg backdrop-blur-sm">
                                    <button onClick={() => openNotesModal(student)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded"><StickyNote size={14} /></button>
                                    <button onClick={() => openAttendanceModal(student)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Calendar size={14} /></button>
                                    <button onClick={() => openEdit(student)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded"><Edit2 size={14} /></button>
                                    <button onClick={() => toggleStudentStatus(student)} className="p-1.5 text-purple-500 hover:bg-purple-50 rounded"><ArrowRight size={14} /></button>
                                    <button onClick={() => confirmDelete(student)} className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                </div>
                              )}
                          </div>

                          {/* Mobile View (Horizontal Compact) */}
                          <div className="sm:hidden flex flex-row items-start p-3 gap-3 relative z-10">
                              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${studentStats.percent >= 75 ? 'bg-gradient-to-b from-emerald-400 to-emerald-600' : 'bg-gradient-to-b from-amber-400 to-amber-600'}`}></div>
                              
                              <div className="flex flex-col items-center gap-2">
                                <Avatar name={student.name} color={student.color || 'bg-blue-500'} photoUrl={student.photoUrl} size="w-16 h-16" onClick={() => { if(student.photoUrl) setFullScreenImage(student.photoUrl); }}/>
                                {/* Mobile Admin Buttons - 2 Cols under Avatar */}
                                {role === 'admin' && (
                                    <div className="grid grid-cols-2 gap-1 w-[70px]">
                                       <button onClick={() => openNotesModal(student)} className="p-1 text-amber-500 bg-amber-50 rounded border border-amber-100 shadow-sm flex items-center justify-center"><StickyNote size={12} /></button>
                                       <button onClick={() => openAttendanceModal(student)} className="p-1 text-blue-500 bg-blue-50 rounded border border-blue-100 shadow-sm flex items-center justify-center"><Calendar size={12} /></button>
                                       <button onClick={() => openEdit(student)} className="p-1 text-slate-500 bg-slate-50 rounded border border-slate-100 shadow-sm flex items-center justify-center"><Edit2 size={12} /></button>
                                       <button onClick={() => toggleStudentStatus(student)} className="p-1 text-purple-500 bg-purple-50 rounded border border-purple-100 shadow-sm flex items-center justify-center"><ArrowRight size={12} /></button>
                                       <button onClick={() => confirmDelete(student)} className="p-1 text-red-500 bg-red-50 rounded border border-red-100 shadow-sm flex items-center justify-center col-span-2"><Trash2 size={12} /></button>
                                    </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0 text-left">
                                <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1 break-words">{student.name}</h3>
                                <div className="text-xs font-medium text-slate-600 mb-0.5">{className}</div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{student.gender || 'Lelaki'}</p>
                                
                                <div className={`inline-block items-center justify-center text-[10px] font-bold text-white px-2 py-0.5 rounded-md uppercase tracking-wide mb-2 shadow-sm ${getSubjectBadgeColor(student.subject)}`}>{student.subject}</div>

                                <div className="flex flex-col gap-1 w-full mt-1">
                                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                                    <span>Attendance</span>
                                    <span className={studentStats.percent >= 75 ? 'text-emerald-600' : 'text-amber-600'}>{studentStats.percent}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"><div className={`h-full rounded-full ${studentStats.percent >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${studentStats.percent}%` }}></div></div>
                                </div>
                              </div>
                          </div>

                          {student.isNewStudent && (
                            <div className="absolute top-2 left-3 sm:left-auto sm:right-2 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse z-20 flex items-center gap-0.5">
                              <span className="w-1.5 h-1.5 bg-white rounded-full"></span> NEW
                            </div>
                          )}
                        </div>
                      )})}
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}

        {/* Image Adjuster Modal (Rendered at root level) */}
        {rawImageSrc && (
          <ImageAdjuster 
            imageSrc={rawImageSrc}
            onSave={handleCropSave}
            onCancel={handleCropCancel}
          />
        )}

        {/* Full Screen Image Viewer (Rendered at root level) */}
        {fullScreenImage && (
          <ImageViewer 
            src={fullScreenImage}
            onClose={() => setFullScreenImage(null)}
          />
        )}
      </main>
{/* ... (Fixed Bottom Nav & Modals remain same) ... */}
<div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 flex justify-around items-center z-50 sm:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
         {[
            { id: 'profile', label: 'Profile', icon: School },
            { id: 'plan', label: 'PLaN', icon: BookOpenCheck },
            { id: 'mbk', label: 'MBK', icon: Accessibility },
            { id: 'lulus', label: 'Lulus', icon: GraduationCap },
            { id: 'stats', label: 'Stats', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full py-3 transition-all duration-200 ${
                currentSection === tab.id
                  ? 'text-indigo-600 bg-indigo-50/50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={20} strokeWidth={currentSection === tab.id ? 2.5 : 2} />
              <span className="text-[10px] font-bold mt-1">{tab.label}</span>
            </button>
          ))}
      </div>
      
      {/* Modals */}
      <Modal isOpen={showAdminLogin} onClose={() => { setShowAdminLogin(false); setAdminPassword(''); setLoginError(''); }} title="Admin Login">
            <form onSubmit={handleAdminLogin} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${loginError ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'}`} value={adminPassword} onChange={(e) => { setAdminPassword(e.target.value); setLoginError(''); }} placeholder="Enter password..." autoFocus />{loginError && <p className="text-xs text-red-500 mt-1">{loginError}</p>}</div>
                <button type="submit" className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm">Authenticate</button>
            </form>
        </Modal>
        <Modal isOpen={deleteConfirmation.isOpen} onClose={() => setDeleteConfirmation({ isOpen: false, studentId: null, studentName: '' })} title="Confirm Deletion">
           <div className="flex flex-col items-center justify-center mb-6 text-center"><div className="bg-red-50 p-4 rounded-full mb-4"><Trash2 className="text-red-600 w-10 h-10" /></div><h4 className="text-lg font-bold text-gray-900 mb-2">Delete Record?</h4><p className="text-gray-500">Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteConfirmation.studentName}</span>? This action cannot be undone.</p></div>
           <div className="flex gap-3"><button onClick={() => setDeleteConfirmation({ isOpen: false, studentId: null, studentName: '' })} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button><button onClick={executeDelete} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm">Yes, Delete</button></div>
        </Modal>
        <Modal isOpen={moveConfirmation.isOpen} onClose={() => setMoveConfirmation({ isOpen: false, student: null, newStatus: '' })} title="Confirm Status Change">
            <div className="flex flex-col items-center justify-center mb-6 text-center"><div className="bg-blue-50 p-4 rounded-full mb-4"><ArrowLeftRight className="text-blue-600 w-10 h-10" /></div><h4 className="text-lg font-bold text-gray-900 mb-2">Move Student?</h4><p className="text-gray-500 mb-4">{moveConfirmation.newStatus === 'Lulus' ? `Mark ${moveConfirmation.student?.name} as "Lulus Pemulihan"?` : `Move ${moveConfirmation.student?.name} back to "Profile Murid Pemulihan"?`}</p>{moveConfirmation.newStatus === 'Lulus' && (<div className="w-full text-left bg-gray-50 p-3 rounded-lg border border-gray-200"><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Graduation Date</label><div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /><input type="date" className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-900 w-full p-0" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} /></div></div>)}</div>
            <div className="flex gap-3"><button onClick={() => setMoveConfirmation({ isOpen: false, student: null, newStatus: '' })} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button><button onClick={executeMove} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm">Confirm</button></div>
        </Modal>
        <Modal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} title="Catatan Murid">
            <div className="space-y-6"><div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg"><Avatar name={selectedStudentForNotes?.name || ''} color={selectedStudentForNotes?.color || 'bg-blue-500'} photoUrl={selectedStudentForNotes?.photoUrl}/><div><h4 className="font-bold text-gray-900">{selectedStudentForNotes?.name}</h4><p className="text-sm text-gray-500">{selectedStudentForNotes?.className}</p></div></div><form onSubmit={saveNote} className="space-y-3"><div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</label><input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" value={noteForm.date} onChange={(e) => setNoteForm({...noteForm, date: e.target.value})}/></div><div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Catatan (Note)</label><textarea required rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" value={noteForm.text} onChange={(e) => setNoteForm({...noteForm, text: e.target.value})} placeholder="Enter note details here..."></textarea></div><button type="submit" className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium shadow-sm transition-colors">{noteForm.id ? 'Update Note' : 'Add Note'}</button></form><div className="border-t border-gray-100 pt-4"><h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Clock size={16} /> History</h5><div className="space-y-3 max-h-60 overflow-y-auto">{selectedStudentForNotes?.notes && selectedStudentForNotes.notes.length > 0 ? ([...selectedStudentForNotes.notes].sort((a, b) => new Date(b.date) - new Date(a.date)).map((note) => (<div key={note.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 relative group"><div className="flex justify-between items-start mb-1"><span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">{note.date}</span><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => startEditNote(note)} className="text-blue-600 hover:text-blue-800"><Edit2 size={14} /></button><button onClick={() => deleteNote(note.id)} className="text-red-600 hover:text-red-800"><Trash2 size={14} /></button></div></div><p className="text-sm text-gray-800 whitespace-pre-wrap">{note.text}</p></div>))) : (<p className="text-center text-sm text-gray-400 py-4">No notes recorded yet.</p>)}</div></div></div>
        </Modal>
        <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title="Manage Attendance">
            <div className="space-y-6"><div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"><Avatar name={selectedStudentForAttendance?.name || ''} color={selectedStudentForAttendance?.color || 'bg-blue-500'} photoUrl={selectedStudentForAttendance?.photoUrl}/><div><h4 className="font-bold text-gray-900">{selectedStudentForAttendance?.name}</h4><p className="text-sm text-gray-500">{selectedStudentForAttendance?.className}</p></div></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Mark for specific date</label><div className="flex gap-2"><input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/><button onClick={() => markAttendance('present')} className="flex items-center gap-1 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 font-medium"><Check size={16} /> Present</button><button onClick={() => markAttendance('absent')} className="flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"><X size={16} /> Absent</button></div></div><div><h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock size={14} /> Record History</h5><div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">{selectedStudentForAttendance?.attendanceRecords?.length > 0 ? ([...selectedStudentForAttendance.attendanceRecords].sort((a, b) => new Date(b.date) - new Date(a.date)).map((record, idx) => (<div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50"><div className="text-sm"><span className="font-medium text-gray-700">{record.date}</span></div><div className="flex items-center gap-3"><span className={`text-xs font-bold px-2 py-1 rounded uppercase ${record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{record.status}</span><button onClick={() => deleteAttendanceRecord(record)} className="text-gray-400 hover:text-red-500" title="Delete entry"><Trash2 size={14} /></button></div></div>))) : (<div className="p-4 text-center text-sm text-gray-400">No records found.</div>)}</div></div></div>
        </Modal>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Student" : "Add New Student"}>
            <form onSubmit={handleSave} className="space-y-4">{!editingId && (<div className="flex p-1 bg-gray-100 rounded-lg mb-4"><button type="button" className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.program === 'pemulihan' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setFormData(prev => ({ ...prev, program: 'pemulihan' }))}>Profile Pemulihan</button><button type="button" className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.program === 'mbk' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setFormData(prev => ({ ...prev, program: 'mbk' }))}>Murid MBK & OKU</button></div>)}<div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors"><div className="mb-3"><Avatar name={formData.name || 'User'} color="bg-gray-300" photoUrl={formData.photoUrl} size="w-20 h-20"/></div><label className="cursor-pointer"><span className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"><Camera size={16} /> {formData.photoUrl ? 'Change Photo' : 'Upload Photo'}</span><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /></label><div className="flex items-center gap-3 mt-2">{formData.photoUrl && (<><button type="button" onClick={() => setRawImageSrc(formData.photoUrl)} className="text-indigo-600 text-xs hover:underline flex items-center font-medium transition-colors"><Edit2 size={12} className="mr-1" />Adjust</button><span className="text-gray-300">|</span><button type="button" onClick={handleRemovePhoto} className="text-red-500 text-xs hover:underline flex items-center font-medium transition-colors"><Trash2 size={12} className="mr-1" />Remove</button></>)}</div><p className="text-xs text-gray-400 mt-1">Max size 5MB</p></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Jane Doe"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Jantina (Gender)</label><div className="flex gap-4"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="gender" value="Lelaki" checked={formData.gender === 'Lelaki'} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="text-blue-600 focus:ring-blue-500"/><span className="text-sm text-gray-700">Lelaki</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="gender" value="Perempuan" checked={formData.gender === 'Perempuan'} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="text-blue-600 focus:ring-blue-500"/><span className="text-sm text-gray-700">Perempuan</span></label></div></div>{formData.program === 'pemulihan' ? (<><div><label className="block text-sm font-medium text-gray-700 mb-1">IC Number (Optional but Recommended)</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm" value={formData.ic} onChange={(e) => setFormData({ ...formData, ic: e.target.value.replace(/\D/g, '') })} placeholder="For Auto-Year Calculation (e.g. 16...)" maxLength={12}/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label><input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm" value={formData.className} onChange={handleClassNameChange} placeholder="e.g. 2 He"/><p className="text-xs text-gray-400 mt-1">Format: Year ClassName (e.g. 2 He)</p></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Subject</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })}>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select></div><div className="flex items-center gap-2 mt-2"><input type="checkbox" id="isNewStudent" checked={formData.isNewStudent || false} onChange={(e) => setFormData({ ...formData, isNewStudent: e.target.checked })} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/><label htmlFor="isNewStudent" className="text-sm font-medium text-gray-700">Murid Baru (插班生)</label></div></>) : (<><div><label className="block text-sm font-medium text-gray-700 mb-1">Kategori (Category)</label><div className="flex gap-4"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="mbkType" value="MBK" checked={formData.mbkType === 'MBK'} onChange={(e) => setFormData({ ...formData, mbkType: e.target.value })} className="text-amber-600 focus:ring-amber-500"/><span className="text-sm text-gray-700">MBK (Tiada Kad)</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="mbkType" value="OKU" checked={formData.mbkType === 'OKU'} onChange={(e) => setFormData({ ...formData, mbkType: e.target.value })} className="text-green-600 focus:ring-green-500"/><span className="text-sm text-gray-700">OKU (Ada Kad)</span></label></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">MyKid / IC Number</label><input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm" value={formData.ic} onChange={(e) => setFormData({ ...formData, ic: e.target.value.replace(/\D/g, '') })} placeholder="e.g. 160520101234" maxLength={12}/><p className="text-xs text-gray-400 mt-1">System will auto-calculate School Year based on first 2 digits.</p></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label><textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} placeholder="Enter optional remarks..." rows="2"></textarea></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Document Link</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm" value={formData.docLink} onChange={(e) => setFormData({ ...formData, docLink: e.target.value })} placeholder="https://..." /></div>{formData.mbkType === 'OKU' && (<div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200"><label className="block text-sm font-medium text-gray-700 mb-2">QR Code (Kad OKU)</label><div className="flex items-center gap-4"><div className="w-20 h-20 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">{formData.qrCodeUrl ? (<img src={formData.qrCodeUrl} alt="QR" className="w-full h-full object-cover" />) : (<QrCode className="text-gray-300" />)}</div><div className="flex flex-col gap-2"><label className="cursor-pointer bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"><Camera size={14} /> Upload QR<input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'qr')} /></label>{formData.qrCodeUrl && (<div className="flex gap-2"><button type="button" onClick={() => { setRawImageSrc(formData.qrCodeUrl); setUploadType('qr'); }} className="text-xs text-blue-600 hover:underline">Adjust</button><button type="button" onClick={() => handleRemovePhoto('qr')} className="text-xs text-red-500 hover:underline">Remove</button></div>)}</div></div></div>)}</>)}<div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button><button type="submit" className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm ${formData.program === 'mbk' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{editingId ? 'Save Changes' : 'Add Student'}</button></div></form>
        </Modal>

    </div>
  );
}
