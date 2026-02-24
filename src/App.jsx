import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Plus, Edit2, Trash2, Shield, Download, CheckCircle, XCircle, GraduationCap,
  BookOpen, PieChart, Camera, Lock, ArrowRight, RotateCcw, Calendar, Clock, Check, X,
  Filter, BarChart3, ArrowLeftRight, Accessibility, School, StickyNote, MessageSquare, 
  FileText, ZoomIn, ZoomOut, Sparkles, QrCode, TrendingUp, Save, Search, ChevronDown, Menu
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
  "KP 1: Pra Nombor", "KP 2: Konsep Nombor", "KP 3: Nombor Bulat", 
  "KP 4: Tambah Lingkungan 10", "KP 5: Tolak Lingkungan 10",
  "KP 6: Tambah Lingkungan 18", "KP 7: Tolak Lingkungan 18",
  "KP 8: Tambah Lingkungan 100", "KP 9: Tolak Lingkungan 100",
  "KP 10: Darab", "KP 11: Bahagi", "KP 12: Wang & Masa"
];

const subjects = ['Pemulihan BM', 'Pemulihan Matematik', 'Pemulihan BM dan Matematik'];
const cardColors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];

// --- Sub-Components ---
const Avatar = ({ name, color, photoUrl, size = "w-12 h-12", onClick }) => {
  const commonClasses = `${size} rounded-xl shadow-sm border-2 border-white ring-1 ring-gray-100 flex-shrink-0 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`;
  if (photoUrl) return <img src={photoUrl} alt={name} className={`${commonClasses} object-cover object-top bg-white`} onClick={onClick} />;
  const initials = (name || "?").split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  return <div className={`${commonClasses} flex items-center justify-center text-white font-bold shadow-sm ${color}`}>{initials}</div>;
};

// --- Helper Functions ---
const calculateSchoolYear = (ic) => {
  if (!ic) return null;
  const icStr = String(ic).replace(/\D/g, ''); 
  if (icStr.length < 2) return null;
  const yearPrefix = parseInt(icStr.substring(0, 2));
  if (isNaN(yearPrefix)) return null;
  return (new Date().getFullYear()) - (2000 + yearPrefix) - 6;
};

const getYearFromClass = (className) => {
  if (!className) return null;
  const yearInt = parseInt(String(className).split(' ')[0]);
  return isNaN(yearInt) ? null : yearInt;
};

const getStudentYear = (student) => calculateSchoolYear(student.ic) || getYearFromClass(student.className) || 0;

const getSubjectBadge = (subject) => {
  if (subject === 'Pemulihan BM') return 'bg-blue-600 text-white';
  if (subject === 'Pemulihan Matematik') return 'bg-orange-500 text-white';
  if (subject === 'Pemulihan BM dan Matematik') return 'bg-purple-600 text-white';
  return 'bg-slate-500 text-white';
};

const calculateStats = (records) => {
  if (!records || records.length === 0) return { percent: 0, present: 0, total: 0 };
  const present = records.filter(r => r.status === 'present').length;
  return { percent: Math.round((present / records.length) * 100), present, total: records.length };
};

// --- MAIN APP COMPONENT ---
export default function StudentDatabaseApp() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // App Theme & Role State
  const [role, setRole] = useState('user'); 
  const [currentSection, setCurrentSection] = useState('profile'); 
  const [selectedAdminStudent, setSelectedAdminStudent] = useState(null); // Touchscreen Opt.
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Dynamic Theme Generator (Solves the "stuck in dark mode" bug)
  const theme = {
    bgApp: isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-800',
    nav: isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200',
    card: isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200',
    textMain: isDarkMode ? 'text-white' : 'text-slate-900',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    input: isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-900',
    modalOverlay: isDarkMode ? 'bg-black/70' : 'bg-slate-900/40',
    modalBody: isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100',
  };

  useEffect(() => { localStorage.setItem('darkMode', JSON.stringify(isDarkMode)); }, [isDarkMode]);
  useEffect(() => { document.title = "Pemulihan SJKC Sin Ming"; }, []);

  // Filters
  const [profileYearFilter, setProfileYearFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [mbkTypeFilter, setMbkTypeFilter] = useState('All');
  const [statsFilters, setStatsFilters] = useState({ year: 'All', gender: 'All', subject: 'All' });
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Forms
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', program: 'pemulihan', className: '', subject: 'Pemulihan BM', ic: '', gender: 'Lelaki', mbkType: 'MBK', status: 'Active', photoUrl: '', remarks: '', docLink: '', isNewStudent: false, qrCodeUrl: '' });
  
  const [fullScreenImage, setFullScreenImage] = useState(null); 
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [uploadType, setUploadType] = useState('profile');

  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState(null);
  const [progressSubject, setProgressSubject] = useState('BM');
  const [studentProgressData, setStudentProgressData] = useState({});

  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, studentId: null, studentName: '' });
  const [moveConfirmation, setMoveConfirmation] = useState({ isOpen: false, student: null, newStatus: '' });
  const [moveDate, setMoveDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedStudentForNotes, setSelectedStudentForNotes] = useState(null);
  const [noteForm, setNoteForm] = useState({ id: null, text: '', date: new Date().toISOString().split('T')[0] });

  // --- Data Fetching ---
  useEffect(() => {
    if (!auth) return;
    signInAnonymously(auth).catch(() => {});
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email === "admin@pemulihan.com") setRole('admin');
      else setRole('user');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'students')), (snapshot) => {
        setStudents(snapshot.docs.map(doc => ({ id: doc.id, attendanceRecords: [], notes: [], ...doc.data() })));
        setLoading(false);
      }, (error) => { console.error("Firestore error:", error); setLoading(false); }
    );
    return () => unsubscribe();
  }, []);

  // --- Handlers ---
  const handleTabChange = (tabId) => {
    setCurrentSection(tabId);
    setSelectedAdminStudent(null);
    if (tabId !== 'progress') {
       setProfileYearFilter('All'); setClassFilter('All'); setSubjectFilter('All'); setMbkTypeFilter('All');
       if (tabId === 'mbk') setProfileYearFilter(''); 
       setSelectedStudentForProgress(null); setSearchQuery('');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
        await signInWithEmailAndPassword(auth, "admin@pemulihan.com", adminPassword);
        setShowAdminLogin(false); setAdminPassword(''); setLoginError('');
    } catch (error) { setLoginError('Incorrect password.'); }
  };

  const handleImageUpload = (e, type = 'profile') => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (event) => { setRawImageSrc(event.target.result); setUploadType(type); };
      reader.readAsDataURL(file);
    } else if (file) alert("Image too large. Please choose under 5MB.");
  };
  
  const handleSave = async (e) => {
    e.preventDefault();
    if (!user || !db) return;
    try {
      const dataToSave = {
        name: formData.name, program: formData.program, gender: formData.gender, status: formData.status,
        photoUrl: formData.photoUrl || '', updatedAt: serverTimestamp(), ic: formData.ic || '', isNewStudent: formData.isNewStudent || false
      };
      
      if (formData.program === 'pemulihan') {
        dataToSave.className = formData.className; dataToSave.subject = formData.subject;
        dataToSave.mbkType = ''; dataToSave.remarks = ''; dataToSave.docLink = ''; dataToSave.qrCodeUrl = '';
      } else {
        dataToSave.mbkType = formData.mbkType; dataToSave.remarks = formData.remarks || ''; 
        dataToSave.docLink = formData.docLink || ''; dataToSave.qrCodeUrl = formData.qrCodeUrl || '';
        dataToSave.className = ''; dataToSave.subject = '';
      }

      if (editingId) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', editingId), dataToSave);
      else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { ...dataToSave, attendanceRecords: [], notes: [], color: cardColors[Math.floor(Math.random() * cardColors.length)], createdAt: serverTimestamp() });
      setIsModalOpen(false); setEditingId(null);
    } catch (err) { console.error("Error saving:", err); }
  };
  
  const handleProgressUpdate = async () => {
    if (!user || !selectedStudentForProgress || !db) return;
    try {
       await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentForProgress.id), { progress: studentProgressData });
       alert("Progress saved successfully!");
    } catch (err) { alert("Failed to save progress."); }
  };
  
  const toggleSkill = (skillIndex) => {
    const currentSubjectKey = progressSubject === 'BM' ? 'bm' : 'math';
    const currentSkills = studentProgressData[currentSubjectKey] || [];
    let newSkills = currentSkills.includes(skillIndex) ? currentSkills.filter(i => i !== skillIndex) : [...currentSkills, skillIndex];
    setStudentProgressData(prev => ({ ...prev, [currentSubjectKey]: newSkills }));
  };

  const exportToExcel = () => {
    if (!students || students.length === 0) { alert("No data to export."); return; }
    const workbook = XLSX.utils.book_new();
    const formatStudent = (s) => ({
      Name: s.name, Gender: s.gender, IC: s.ic || '', Class: s.className || '', Subject: s.subject || '',
      Program: s.program === 'mbk' ? (s.mbkType || 'MBK') : 'Pemulihan', Status: s.status, Remarks: s.remarks || '', DocLink: s.docLink || '',
    });

    const addSheet = (data, name) => { if(data.length > 0) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), name); };
    addSheet(students.filter(s => s.program === 'pemulihan' && s.status !== 'Lulus' && getStudentYear(s) <= 3).map(formatStudent), "Profile");
    addSheet(students.filter(s => s.program === 'pemulihan' && s.status !== 'Lulus' && getStudentYear(s) >= 4 && getStudentYear(s) <= 6).map(formatStudent), "PLaN");
    addSheet(students.filter(s => s.program === 'mbk').map(formatStudent), "MBK");
    addSheet(students.filter(s => s.status === 'Lulus').map(s => ({ ...formatStudent(s), GraduationDate: s.graduationDate || '' })), "Lulus");
    XLSX.writeFile(workbook, "Student_Database.xlsx");
  };

  const markAttendance = async (status) => {
    if (!user || !selectedStudentForAttendance || !db) return;
    const newRecord = { date: attendanceDate, status: status, timestamp: Date.now() };
    try {
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentForAttendance.id);
      const existingRecord = selectedStudentForAttendance.attendanceRecords?.find(r => r.date === newRecord.date);
      if (existingRecord) await updateDoc(ref, { attendanceRecords: arrayRemove(existingRecord) });
      await updateDoc(ref, { attendanceRecords: arrayUnion(newRecord) });
      setIsAttendanceModalOpen(false); // Auto close
    } catch (err) { console.error("Error marking attendance:", err); }
  };

  const saveNote = async (e) => {
    e.preventDefault();
    if (!user || !selectedStudentForNotes || !db) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentForNotes.id);
    let newNotes = [...(selectedStudentForNotes.notes || [])];
    if (noteForm.id) newNotes = newNotes.map(n => n.id === noteForm.id ? { ...n, text: noteForm.text, date: noteForm.date } : n);
    else newNotes.push({ id: Date.now().toString(), text: noteForm.text, date: noteForm.date, timestamp: Date.now() });
    try { await updateDoc(ref, { notes: newNotes }); setNoteForm({ id: null, text: '', date: new Date().toISOString().split('T')[0] }); } catch (err) {}
  };

  // --- Derived State & Filtering ---
  const availableYears = useMemo(() => ['All', ...Array.from(new Set(students.filter(s => s.program === 'pemulihan').map(s => getYearFromClass(s.className)).filter(y => y !== null))).sort()], [students]);
  const availableClasses = useMemo(() => ['All', ...Array.from(new Set(students.filter(s => s.program === 'pemulihan').map(s => s.className).filter(Boolean))).sort()], [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const year = getStudentYear(s);
      
      if (currentSection === 'mbk') {
        return s.program === 'mbk' && year <= 6 && 
               (profileYearFilter === 'All' || profileYearFilter === '' || (s.name || '').toLowerCase().includes(profileYearFilter.toLowerCase())) &&
               (mbkTypeFilter === 'All' || s.mbkType === mbkTypeFilter);
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
  }, [students, profileYearFilter, classFilter, subjectFilter, currentSection, statsFilters, searchQuery, mbkTypeFilter]);

  const groupedProfileStudents = useMemo(() => {
    if (currentSection !== 'profile') return {};
    const groups = {};
    students.filter(s => s.program === 'pemulihan' && s.status !== 'Lulus' && getStudentYear(s) <= 3 && 
        (profileYearFilter === 'All' || getStudentYear(s) === parseInt(profileYearFilter)) &&
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
    students.filter(s => s.program === 'pemulihan' && s.status !== 'Lulus' && getStudentYear(s) >= 4 && getStudentYear(s) <= 6)
            .forEach(s => { const k = `Tahun ${getStudentYear(s)}`; if (!groups[k]) groups[k] = []; groups[k].push(s); });
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

  // --- Dynamic Student Card Rendering ---
  const renderStudentCard = (student, sectionType) => {
    const isMbk = sectionType === 'mbk';
    const isLulus = sectionType === 'lulus';
    const isProfile = sectionType === 'profile';
    const year = getStudentYear(student);
    const stats = calculateStats(student.attendanceRecords || []);
    const isSelected = selectedAdminStudent === student.id;

    const handleCardClick = () => {
      if (role === 'admin') setSelectedAdminStudent(isSelected ? null : student.id);
    };

    return (
      <div 
        key={student.id} 
        onClick={handleCardClick}
        className={`${theme.card} rounded-2xl shadow-sm hover:shadow-lg border transition-all duration-300 ${isSelected ? 'ring-2 ring-indigo-500 scale-[1.02]' : 'hover:-translate-y-1'} relative group overflow-hidden flex flex-col cursor-pointer`}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isLulus ? 'bg-purple-500' : isMbk ? 'bg-indigo-500' : stats.percent >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
        
        <div className={`flex flex-col items-center gap-4 ${isMbk ? 'p-6' : 'p-4'} pl-5`}>
          <Avatar name={student.name} color={student.color} photoUrl={student.photoUrl} size={isMbk ? "w-20 h-20" : "w-16 h-16"} onClick={(e) => { e.stopPropagation(); if(student.photoUrl) setFullScreenImage(student.photoUrl); }}/>
          
          <div className="w-full text-center">
            <h3 className={`font-bold ${isMbk ? 'text-lg' : 'text-sm'} ${theme.textMain} leading-tight mb-1 break-words`}>{student.name}</h3>
            
            {isMbk ? (
               <>
                 <div className="flex items-center justify-center gap-2 mb-3"><CreditCard size={16} className={theme.textMuted}/><span className={`font-bold ${theme.textMuted} tracking-wide font-mono`}>{student.ic}</span></div>
                 <div className={`p-2 rounded-lg text-sm font-medium mb-2 ${isDarkMode ? 'bg-indigo-900/30 text-indigo-200' : 'bg-indigo-50 text-indigo-900'}`}>{year < 1 ? 'Pra' : `Tahun ${year}`}</div>
                 <div className={`text-sm font-medium ${theme.textMuted}`}>{student.gender} • <span className={`px-2 py-0.5 rounded text-xs font-bold ${student.mbkType === 'OKU' ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (isDarkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700')}`}>{student.mbkType || 'MBK'}</span></div>
               </>
            ) : (
               <>
                 <div className={`text-xs font-medium mb-0.5 ${theme.textMuted}`}>{student.className || student.subject}</div>
                 <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${theme.textMuted}`}>{student.gender}</p>
                 {!isLulus && <div className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide mb-2 shadow-sm ${getSubjectBadge(student.subject)}`}>{student.subject}</div>}
                 {isLulus && <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border inline-block mt-1 ${isDarkMode ? 'text-purple-400 bg-purple-900/30 border-purple-800' : 'text-purple-600 bg-purple-50 border-purple-100'}`}>Grad: {student.graduationDate}</div>}
               </>
            )}

            {isProfile && (
              <div className="flex flex-col gap-1 w-full mt-1">
                <div className={`flex justify-between items-center text-[10px] font-bold uppercase ${theme.textMuted}`}>
                  <span>Attendance</span><span className={stats.percent >= 75 ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') : (isDarkMode ? 'text-amber-400' : 'text-amber-600')}>{stats.percent}%</span>
                </div>
                <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}><div className={`h-full rounded-full ${stats.percent >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${stats.percent}%` }}></div></div>
              </div>
            )}
          </div>
          
          {isMbk && student.remarks && <div className={`w-full mt-2 p-3 rounded-lg flex items-start gap-2 text-left border ${isDarkMode ? 'bg-yellow-900/20 border-yellow-800/50 text-slate-300' : 'bg-yellow-50 border-yellow-200 text-slate-700'}`}><MessageSquare size={16} className={`mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'}`} /><p className="text-xs italic">{student.remarks}</p></div>}
          
          {isMbk && (
            <div className={`mt-2 w-full pt-4 border-t flex flex-col gap-2 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <button onClick={(e) => { e.stopPropagation(); window.open(student.docLink, '_blank'); }} disabled={!student.docLink} className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white py-2.5 rounded-xl transition-all shadow-sm ${student.docLink ? 'bg-indigo-600 hover:bg-indigo-700' : (isDarkMode ? 'bg-slate-700 cursor-not-allowed text-slate-500' : 'bg-slate-300 cursor-not-allowed')}`}><FileText size={16} /> Docs</button>
              {student.mbkType === 'OKU' && student.qrCodeUrl && (
                <button onClick={(e) => { e.stopPropagation(); setFullScreenImage(student.qrCodeUrl); }} className={`flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-xl transition-all shadow-sm border ${isDarkMode ? 'bg-slate-800 text-white border-slate-600 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}><QrCode size={16} /> Show QR</button>
              )}
            </div>
          )}

          {/* Admin Touchscreen-Optimized Controls */}
          {role === 'admin' && (
            <div className={`absolute top-2 right-2 flex ${isMbk ? 'flex-row' : 'flex-col'} gap-1 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 sm:group-hover:opacity-100'} p-1 rounded-lg backdrop-blur-md shadow-lg border ${isDarkMode ? 'bg-slate-800/95 border-slate-600' : 'bg-white/95 border-slate-200'}`}>
               {(!isMbk && !isLulus) && <button onClick={(e) => { e.stopPropagation(); openNotesModal(student); }} className={`p-2 rounded-md transition-colors ${isDarkMode ? 'text-amber-400 hover:bg-slate-700' : 'text-amber-500 hover:bg-amber-50'}`} title="Notes"><StickyNote size={18} /></button>}
               {isProfile && <button onClick={(e) => { e.stopPropagation(); openAttendanceModal(student); }} className={`p-2 rounded-md transition-colors ${isDarkMode ? 'text-blue-400 hover:bg-slate-700' : 'text-blue-500 hover:bg-blue-50'}`} title="Attendance"><Calendar size={18} /></button>}
               <button onClick={(e) => { e.stopPropagation(); openEdit(student); }} className={`p-2 rounded-md transition-colors ${isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`} title="Edit"><Edit2 size={18} /></button>
               {!isMbk && <button onClick={(e) => { e.stopPropagation(); toggleStudentStatus(student); }} className={`p-2 rounded-md transition-colors ${isDarkMode ? 'text-purple-400 hover:bg-slate-700' : 'text-purple-500 hover:bg-purple-50'}`} title="Change Status"><RotateCcw size={18} /></button>}
               <button onClick={(e) => { e.stopPropagation(); confirmDelete(student); }} className={`p-2 rounded-md transition-colors ${isDarkMode ? 'text-red-400 hover:bg-slate-700' : 'text-red-500 hover:bg-red-50'}`} title="Delete"><Trash2 size={18} /></button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Return JSX ---
  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.bgApp} font-sans selection:bg-indigo-200 dark:selection:bg-indigo-900`}>
      <nav className={`backdrop-blur-md border-b sticky top-0 z-30 transition-colors duration-300 ${theme.nav}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-md"><GraduationCap className="text-white h-6 w-6" /></div>
              <span className={`font-bold text-lg tracking-tight hidden sm:block ${theme.textMain}`}>
                Pengurusan Program Pemulihan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-400 font-mono tracking-widest uppercase">DIGITAL</span>
              </span>
              <span className={`font-bold text-lg tracking-tight sm:hidden ${theme.textMain}`}>Pemulihan <span className="text-indigo-500">DIGITAL</span></span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full transition-colors focus:outline-none ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}>
                {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
              </button>
              <div className={`rounded-full p-1 flex items-center text-xs font-bold shadow-inner ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100/80'}`}>
                <button onClick={() => handleRoleSwitch('admin')} className={`px-4 py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 ${role === 'admin' ? (isDarkMode ? 'bg-slate-700 text-indigo-400 shadow-sm' : 'bg-white shadow-sm text-indigo-600') : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700')}`}>{role === 'admin' && <Shield size={12} />} Admin</button>
                <button onClick={() => handleRoleSwitch('user')} className={`px-4 py-1.5 rounded-full transition-all duration-300 ${role === 'user' ? (isDarkMode ? 'bg-slate-700 text-indigo-400 shadow-sm' : 'bg-white shadow-sm text-indigo-600') : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700')}`}>User</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center mb-8">
          <div className="w-full overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 flex sm:justify-center">
            <div className={`flex p-1.5 rounded-2xl shadow-sm border gap-1 min-w-max transition-colors ${theme.card}`}>
              {[{ id: 'profile', label: 'Profile Pemulihan' }, { id: 'plan', label: 'PLaN' }, { id: 'mbk', label: 'MBK & OKU' }, { id: 'lulus', label: 'Lulus' }, { id: 'stats', label: 'Statistik' }, { id: 'progress', label: 'Progress' }].map(tab => (
                <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${currentSection === tab.id ? 'bg-indigo-600 text-white shadow-md' : (isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')}`}>{tab.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* --- STATS SECTION --- */}
        {currentSection === 'stats' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className={`p-6 rounded-2xl border shadow-sm transition-colors ${theme.card}`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.textMain}`}><Filter size={20} className="text-indigo-500" /> Filter Database</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative"><label className={`block text-xs font-bold uppercase mb-1.5 ${theme.textMuted}`}>Year</label><select className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none font-medium transition-colors ${theme.input}`} value={statsFilters.year} onChange={(e) => setStatsFilters(p => ({...p, year: e.target.value}))}><option value="All">Semua Tahun</option>{availableYears.filter(y=>y!=='All').map(y => <option key={y} value={y}>{`Tahun ${y}`}</option>)}</select><ChevronDown className="absolute right-3 top-9 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                <div className="relative"><label className={`block text-xs font-bold uppercase mb-1.5 ${theme.textMuted}`}>Gender</label><select className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none font-medium transition-colors ${theme.input}`} value={statsFilters.gender} onChange={(e) => setStatsFilters(p => ({...p, gender: e.target.value}))}><option value="All">Semua Jantina</option><option value="Lelaki">Lelaki</option><option value="Perempuan">Perempuan</option></select><ChevronDown className="absolute right-3 top-9 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                <div className="relative"><label className={`block text-xs font-bold uppercase mb-1.5 ${theme.textMuted}`}>Subject</label><select className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none font-medium transition-colors ${theme.input}`} value={statsFilters.subject} onChange={(e) => setStatsFilters(p => ({...p, subject: e.target.value}))}><option value="All">Semua Subjek</option>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select><ChevronDown className="absolute right-3 top-9 text-slate-400 w-4 h-4 pointer-events-none" /></div>
              </div>
            </div>
            <div className={`p-8 rounded-2xl border flex items-center justify-between shadow-sm transition-colors ${isDarkMode ? 'bg-orange-900/20 border-orange-800/50' : 'bg-orange-50 border-orange-100'}`}>
              <div><p className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>Students Found (Pemulihan Only)</p><h2 className={`text-5xl font-extrabold mt-1 tracking-tight ${isDarkMode ? 'text-orange-300' : 'text-orange-900'}`}>{filteredStudents.length}</h2></div>
              <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-orange-900/50' : 'bg-orange-100'}`}><PieChart className="text-orange-500 w-12 h-12" /></div>
            </div>
            {filteredStudents.length > 0 && (
              <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${theme.card}`}>
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className={`border-b ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}><tr><th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Name</th><th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Gender</th><th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Class</th><th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Subject</th></tr></thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-50'}`}>
                      {filteredStudents.map(student => (
                        <tr key={student.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/80'}`}>
                          <td className={`px-6 py-4 font-bold ${theme.textMain}`}>{student.name}</td>
                          <td className={`px-6 py-4 ${theme.textMuted}`}>{student.gender || 'Lelaki'}</td>
                          <td className="px-6 py-4"><span className={`rounded px-2 py-1 font-mono text-xs ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{student.className}</span></td>
                          <td className={`px-6 py-4 ${theme.textMuted}`}>{student.subject}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- PROGRESS SECTION --- */}
        {currentSection === 'progress' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {selectedStudentForProgress ? (
               <div className={`rounded-3xl border shadow-sm overflow-hidden transition-colors ${theme.card}`}>
                 <div className={`border-b p-6 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-4"><Avatar name={selectedStudentForProgress.name} color={selectedStudentForProgress.color} photoUrl={selectedStudentForProgress.photoUrl} size="w-20 h-20" /><div><h3 className={`font-bold text-xl ${theme.textMain}`}>{selectedStudentForProgress.name}</h3><p className={`text-sm mb-1 ${theme.textMuted}`}>{selectedStudentForProgress.className}</p><div className={`inline-block px-2 py-0.5 rounded text-xs font-bold shadow-sm ${getSubjectBadge(selectedStudentForProgress.subject)}`}>{selectedStudentForProgress.subject}</div></div></div>
                    <button onClick={() => setSelectedStudentForProgress(null)} className={`px-4 py-2 border rounded-xl text-sm font-bold shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 hover:bg-slate-50'}`}>Change Student</button>
                 </div>
                 <div className={`flex border-b transition-colors ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                    {(selectedStudentForProgress.subject === 'Pemulihan BM' || selectedStudentForProgress.subject === 'Pemulihan BM dan Matematik') && (<button onClick={() => setProgressSubject('BM')} className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${progressSubject === 'BM' ? 'text-indigo-600 border-b-2 border-indigo-600' : (isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100')}`}>Bahasa Melayu</button>)}
                    {(selectedStudentForProgress.subject === 'Pemulihan Matematik' || selectedStudentForProgress.subject === 'Pemulihan BM dan Matematik') && (<button onClick={() => setProgressSubject('MATH')} className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${progressSubject === 'MATH' ? 'text-emerald-600 border-b-2 border-emerald-600' : (isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100')}`}>Matematik</button>)}
                 </div>
                 <div className="p-6 md:p-8">
                    <div className="mb-8"><div className="flex justify-between items-end mb-2"><h4 className={`font-bold text-lg ${theme.textMain}`}>Overall Progress</h4><span className={`text-sm font-bold ${theme.textMuted}`}>{studentProgressData[progressSubject === 'BM' ? 'bm' : 'math']?.length || 0} / {progressSubject === 'BM' ? KEMAHIRAN_BM.length : KEMAHIRAN_MATH.length}</span></div><RetroProgressBar progress={((studentProgressData[progressSubject === 'BM' ? 'bm' : 'math']?.length || 0) / (progressSubject === 'BM' ? KEMAHIRAN_BM.length : KEMAHIRAN_MATH.length)) * 100} /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                       {(progressSubject === 'BM' ? KEMAHIRAN_BM : KEMAHIRAN_MATH).map((skill, index) => {
                          const skillIndex = index + 1; const subjectKey = progressSubject === 'BM' ? 'bm' : 'math'; const isCompleted = studentProgressData[subjectKey]?.includes(skillIndex);
                          return (
                            <div key={index} onClick={() => { if(role === 'admin') toggleSkill(skillIndex); }} className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all duration-200 ${isCompleted ? (progressSubject === 'BM' ? (isDarkMode ? 'bg-indigo-900/30 border-indigo-800' : 'bg-indigo-50 border-indigo-200 shadow-sm') : (isDarkMode ? 'bg-emerald-900/30 border-emerald-800' : 'bg-emerald-50 border-emerald-200 shadow-sm')) : (isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-100 hover:border-slate-300')}`}>
                               <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${isCompleted ? (progressSubject === 'BM' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-emerald-600 border-emerald-600 text-white') : (isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300')}`}>{isCompleted && <Check size={16} strokeWidth={3} />}</div>
                               <span className={`text-sm font-medium ${isCompleted ? (isDarkMode ? 'text-white' : 'text-slate-900') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>{skill}</span>
                            </div>
                          );
                       })}
                    </div>
                    {role === 'admin' && (
                      <div className={`mt-8 pt-6 border-t flex justify-end ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                        <button onClick={handleProgressUpdate} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"><Save size={18} /> Save Progress</button>
                      </div>
                    )}
                 </div>
               </div>
             ) : (
               <div className={`rounded-3xl border shadow-sm p-6 md:p-12 text-center transition-colors ${theme.card}`}>
                  <div className="max-w-2xl mx-auto">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isDarkMode ? 'bg-indigo-900/50' : 'bg-indigo-50'}`}><TrendingUp className="text-indigo-600 w-8 h-8" /></div>
                    <h2 className={`text-2xl font-bold mb-2 ${theme.textMain}`}>Student Progress Tracker</h2>
                    <p className={`mb-8 ${theme.textMuted}`}>Select a student from the list below to view or update their mastery of skills (Kemahiran).</p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full mb-4">
                        <div className="relative group flex-1"><select className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm appearance-none transition-colors ${theme.input}`} value={profileYearFilter} onChange={(e) => setProfileYearFilter(e.target.value)}><option value="All">Filter: All Years</option>{availableYears.filter(y => y !== 'All').map(y => <option key={y} value={y}>{`Tahun ${y}`}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                        <div className="relative group flex-1"><select className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm appearance-none transition-colors ${theme.input}`} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}><option value="All">Filter: All Classes</option>{availableClasses.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                        <div className="relative group flex-1"><select className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm appearance-none transition-colors ${theme.input}`} value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}><option value="All">Semua Subjek</option>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                    </div>
                    <div className="relative mb-6"><Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" /><input type="text" placeholder="Search student name..." className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none transition-colors ${theme.input}`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                       {filteredStudents.map(student => (
                         <button key={student.id} onClick={() => { setSelectedStudentForProgress(student); setStudentProgressData(student.progress || { bm: [], math: [] }); setProgressSubject((student.subject || '').includes('Matematik') && !(student.subject || '').includes('BM') ? 'MATH' : 'BM'); }} className={`w-full flex items-center gap-3 p-3 border rounded-xl transition-all text-left group ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'}`}>
                            <Avatar name={student.name} color={student.color} photoUrl={student.photoUrl} size="w-10 h-10" />
                            <div><h4 className={`font-bold transition-colors ${isDarkMode ? 'text-white group-hover:text-indigo-400' : 'text-slate-800 group-hover:text-indigo-700'}`}>{student.name}</h4><p className="text-xs text-slate-500">{student.className}</p></div><ArrowRight size={16} className={`ml-auto transition-colors ${isDarkMode ? 'text-slate-600 group-hover:text-indigo-400' : 'text-slate-300 group-hover:text-indigo-400'}`} />
                         </button>
                       ))}
                       {filteredStudents.length === 0 && <p className={`text-sm py-4 ${theme.textMuted}`}>No students found matching your search.</p>}
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
             <div className={`flex flex-col lg:flex-row gap-4 mb-8 justify-between items-start lg:items-center p-4 rounded-2xl shadow-sm border transition-colors ${theme.card}`}>
                {currentSection === 'profile' && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative group"><select className={`w-full sm:w-48 px-4 py-2.5 border rounded-xl font-bold text-sm appearance-none transition-colors focus:ring-2 focus:ring-indigo-500 cursor-pointer ${theme.input}`} value={profileYearFilter} onChange={(e) => setProfileYearFilter(e.target.value)}><option value="All">Filter: All Years</option>{availableYears.filter(y=>y!=='All').map(y => <option key={y} value={y}>{`Tahun ${y}`}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                    <div className="relative group"><select className={`w-full sm:w-48 px-4 py-2.5 border rounded-xl font-bold text-sm appearance-none transition-colors focus:ring-2 focus:ring-indigo-500 cursor-pointer ${theme.input}`} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}><option value="All">Filter: All Classes</option>{availableClasses.filter(c=>c!=='All').map(c => <option key={c} value={c}>{c}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                    <div className="relative group"><select className={`w-full sm:w-48 px-4 py-2.5 border rounded-xl font-bold text-sm appearance-none transition-colors focus:ring-2 focus:ring-indigo-500 cursor-pointer ${theme.input}`} value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}><option value="All">Semua Subjek</option>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                  </div>
                )}
                {currentSection === 'mbk' && (
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-auto">
                    <h2 className={`text-2xl font-extrabold tracking-tight ml-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-900'}`}>MBK & OKU</h2>
                    <div className="relative group w-full sm:w-auto"><select className={`w-full sm:w-48 px-4 py-2.5 border rounded-xl font-bold text-sm appearance-none transition-colors focus:ring-2 focus:ring-indigo-500 cursor-pointer ${theme.input}`} value={mbkTypeFilter} onChange={(e) => setMbkTypeFilter(e.target.value)}><option value="All">Semua Kategori</option><option value="MBK">MBK Sahaja</option><option value="OKU">OKU Sahaja</option></select><ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" /></div>
                  </div>
                )}
                {currentSection === 'plan' && <h2 className={`text-2xl font-extrabold tracking-tight ml-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`}>PLaN (Thn 4-6)</h2>}
                {currentSection === 'lulus' && <h2 className={`text-2xl font-extrabold tracking-tight ml-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-900'}`}>Graduates (Lulus)</h2>}

                <div className="flex gap-3 w-full lg:w-auto items-center ml-auto">
                   {(role === 'admin' && (currentSection === 'profile' || currentSection === 'mbk')) && <button onClick={openAdd} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 text-white px-5 py-2.5 rounded-xl shadow-md font-bold text-sm"><Plus size={18} strokeWidth={2.5}/> Add Student</button>}
                   <button onClick={exportToExcel} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 text-sm font-bold px-5 py-2.5 border rounded-xl transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Download size={18} /> Export Excel</button>
                </div>
             </div>

             {/* Dynamic Grids */}
             {loading ? <div className="text-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mx-auto mb-4"></div><p className={theme.textMuted}>Loading database...</p></div> : 
               (currentSection === 'profile' && Object.keys(groupedProfileStudents).length === 0) || (currentSection === 'plan' && Object.keys(groupedPlanStudents).length === 0) || (currentSection === 'mbk' && filteredStudents.length === 0) || (currentSection === 'lulus' && Object.keys(groupedLulusStudents).length === 0) ? 
               <div className={`text-center py-24 rounded-3xl border border-dashed shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}><Users className="text-slate-400 w-10 h-10 mx-auto mb-4"/><h3 className={`text-xl font-bold ${theme.textMain}`}>No students found</h3></div> : 
               
               <div className="space-y-10">
                  {/* Profile Groups */}
                  {currentSection === 'profile' && Object.keys(groupedProfileStudents).sort().map(className => {
                    const style = getClassColorStyle(className);
                    return (
                      <div key={className} className={`rounded-3xl border shadow-sm overflow-hidden ${theme.card}`}>
                        <div className={`px-8 py-4 border-b ${style.border} flex justify-between ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}><h3 className={`font-extrabold ${style.text} text-lg flex items-center gap-3`}><School className={style.icon} size={20}/>{className}</h3><span className={`text-xs font-bold ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'} ${style.icon} px-3 py-1.5 border rounded-lg shadow-sm`}>{groupedProfileStudents[className].length} Students</span></div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{groupedProfileStudents[className].map(s => renderStudentCard(s, 'profile'))}</div>
                      </div>
                    )
                  })}
                  
                  {/* PLaN Groups */}
                  {currentSection === 'plan' && Object.keys(groupedPlanStudents).sort().map(yearGrp => (
                    <div key={yearGrp} className={`rounded-3xl border shadow-sm overflow-hidden ${theme.card}`}>
                      <div className={`px-8 py-4 border-b flex justify-between ${isDarkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-100'}`}><h3 className={`font-extrabold text-lg flex items-center gap-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`}><BookOpenCheck className="text-blue-500" size={20}/>{yearGrp}</h3><span className={`text-xs font-bold px-3 py-1.5 border rounded-lg shadow-sm ${isDarkMode ? 'bg-slate-900 border-blue-800 text-blue-400' : 'bg-white border-blue-100 text-blue-700'}`}>{groupedPlanStudents[yearGrp].length} Students</span></div>
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{groupedPlanStudents[yearGrp].map(s => renderStudentCard(s, 'plan'))}</div>
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
                    <div key={yearGrp} className={`rounded-3xl border shadow-sm overflow-hidden ${theme.card}`}>
                      <div className={`px-8 py-4 border-b flex justify-between ${isDarkMode ? 'bg-purple-900/30 border-purple-800' : 'bg-purple-50 border-purple-100'}`}><h3 className={`font-extrabold text-lg flex items-center gap-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-900'}`}><Calendar className="text-purple-500" size={20}/>{yearGrp}</h3><span className={`text-xs font-bold px-3 py-1.5 border rounded-lg shadow-sm ${isDarkMode ? 'bg-slate-900 border-purple-800 text-purple-400' : 'bg-white border-purple-100 text-purple-700'}`}>{groupedLulusStudents[yearGrp].students.length} Students</span></div>
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{groupedLulusStudents[yearGrp].students.map(s => renderStudentCard(s, 'lulus'))}</div>
                    </div>
                  ))}
               </div>
             }
           </div>
        )}

        {/* --- GLOBAL MODALS (Image/Camera) --- */}
        {rawImageSrc && <ImageAdjuster imageSrc={rawImageSrc} onSave={handleCropSave} onCancel={handleCropCancel} />}
        {fullScreenImage && <ImageViewer src={fullScreenImage} onClose={() => setFullScreenImage(null)} />}
      </main>

      {/* --- MOBILE BOTTOM NAV --- */}
      <div className={`fixed bottom-0 left-0 w-full backdrop-blur-md border-t flex justify-around items-center z-50 sm:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-colors duration-300 pb-safe ${theme.nav}`}>
         {[
           { id: 'profile', l: 'Profile', i: School }, { id: 'plan', l: 'PLaN', i: BookOpenCheck }, 
           { id: 'mbk', l: 'MBK', i: Accessibility }, { id: 'lulus', l: 'Lulus', i: GraduationCap }, 
           { id: 'stats', l: 'Stats', i: BarChart3 }, { id: 'progress', l: 'Prog', i: TrendingUp }
         ].map(t => (
            <button key={t.id} onClick={()=>handleTabChange(t.id)} className={`flex flex-col items-center justify-center w-full py-3 transition-colors ${currentSection===t.id?(isDarkMode ? 'text-indigo-400 bg-indigo-900/20' : 'text-indigo-600 bg-indigo-50/50'):(isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}>
              <t.i size={20} strokeWidth={currentSection===t.id?2.5:2}/>
              <span className="text-[10px] font-bold mt-1">{t.l}</span>
            </button>
         ))}
      </div>
      
      {/* --- FUNCTIONAL MODALS --- */}
      <Modal isOpen={showAdminLogin} onClose={()=>{setShowAdminLogin(false); setLoginError('');}} title="Admin Login">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className={`p-3 rounded-full mb-3 ${isDarkMode ? 'bg-indigo-900/30' : 'bg-blue-50'}`}><Lock className={`w-8 h-8 ${isDarkMode ? 'text-indigo-400' : 'text-blue-600'}`} /></div>
          <p className={`text-sm text-center ${theme.textMuted}`}>Enter admin password.</p>
        </div>
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <input type="password" placeholder="Password" autoFocus className={`w-full p-2.5 border rounded-xl focus:outline-none ${theme.input}`} value={adminPassword} onChange={e=>{setAdminPassword(e.target.value); setLoginError('');}}/>
          {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
          <button className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">Login</button>
        </form>
      </Modal>

      <Modal isOpen={deleteConfirmation.isOpen} onClose={()=>setDeleteConfirmation({isOpen:false})} title="Confirm Deletion">
        <div className="flex flex-col items-center mb-6">
          <div className={`p-4 rounded-full mb-3 ${isDarkMode ? 'bg-red-900/30' : 'bg-red-50'}`}><Trash2 className={`w-8 h-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} /></div>
          <p className={theme.textMain}>Delete <span className="font-bold">{deleteConfirmation.studentName}</span>?</p>
        </div>
        <div className="flex gap-3"><button onClick={()=>setDeleteConfirmation({isOpen:false})} className={`flex-1 py-2.5 font-bold rounded-xl ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}>Cancel</button><button onClick={executeDelete} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl">Delete</button></div>
      </Modal>

      <Modal isOpen={moveConfirmation.isOpen} onClose={()=>setMoveConfirmation({isOpen:false})} title="Change Status">
        <div className="flex flex-col items-center mb-6">
          <div className={`p-4 rounded-full mb-3 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}><ArrowLeftRight className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} /></div>
          <p className={`mb-4 ${theme.textMain}`}>Change status to: <span className="font-bold">{moveConfirmation.newStatus}</span>?</p>
          {moveConfirmation.newStatus === 'Lulus' && <div className="w-full text-left"><label className={`text-xs font-bold ${theme.textMuted}`}>Graduation Date</label><input type="date" value={moveDate} onChange={e=>setMoveDate(e.target.value)} className={`w-full mt-1 p-2.5 border rounded-xl ${theme.input} style-color-scheme-dark`}/></div>}
        </div>
        <div className="flex gap-3"><button onClick={()=>setMoveConfirmation({isOpen:false})} className={`flex-1 py-2.5 font-bold rounded-xl ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}>Cancel</button><button onClick={executeMove} className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Confirm</button></div>
      </Modal>

      <Modal isOpen={isNotesModalOpen} onClose={()=>setIsNotesModalOpen(false)} title="Catatan">
        <div className={`flex gap-3 mb-4 p-4 rounded-xl ${isDarkMode ? 'bg-amber-900/20 border border-amber-800/50' : 'bg-amber-50'}`}><Avatar name={selectedStudentForNotes?.name||''} photoUrl={selectedStudentForNotes?.photoUrl}/><div className={`font-bold mt-1 ${theme.textMain}`}>{selectedStudentForNotes?.name}</div></div>
        <form onSubmit={saveNote} className="space-y-3">
          <input type="date" required className={`w-full p-2.5 border rounded-xl focus:outline-none ${theme.input} style-color-scheme-dark`} value={noteForm.date} onChange={e=>setNoteForm(p=>({...p, date:e.target.value}))}/>
          <textarea required rows="3" placeholder="Notes here..." className={`w-full p-2.5 border rounded-xl focus:outline-none ${theme.input}`} value={noteForm.text} onChange={e=>setNoteForm(p=>({...p, text:e.target.value}))}/>
          <button className="w-full py-2.5 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700">{noteForm.id?'Update':'Add'} Note</button>
        </form>
        <div className="mt-4 max-h-40 overflow-auto space-y-2">
          {selectedStudentForNotes?.notes?.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map(n=>(
            <div key={n.id} className={`p-3 border rounded-xl text-sm group relative ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`font-bold px-2 py-0.5 rounded border mr-2 ${isDarkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-white text-slate-500'}`}>{n.date}</span><p className={`mt-2 whitespace-pre-wrap ${theme.textMain}`}>{n.text}</p>
              <div className={`absolute top-2 right-2 hidden group-hover:flex gap-1 p-1 shadow-sm rounded-lg ${isDarkMode ? 'bg-slate-900/90' : 'bg-white/90'}`}><button type="button" onClick={()=>startEditNote(n)} className="p-1"><Edit2 size={14} className="text-blue-500"/></button><button type="button" onClick={()=>deleteNote(n.id)} className="p-1"><Trash2 size={14} className="text-red-500"/></button></div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isAttendanceModalOpen} onClose={()=>setIsAttendanceModalOpen(false)} title="Attendance">
         <div className={`flex gap-3 mb-4 p-4 rounded-xl ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50'}`}><Avatar name={selectedStudentForAttendance?.name||''} photoUrl={selectedStudentForAttendance?.photoUrl}/><div className={`font-bold mt-1 ${theme.textMain}`}>{selectedStudentForAttendance?.name}</div></div>
         <input type="date" className={`w-full p-2.5 border rounded-xl mb-3 focus:outline-none ${theme.input} style-color-scheme-dark`} value={attendanceDate} onChange={e=>setAttendanceDate(e.target.value)}/>
         <div className="flex gap-2 mb-4">
           <button onClick={()=>markAttendance('present')} className={`flex-1 flex items-center justify-center gap-1 py-2.5 font-bold rounded-xl transition-colors ${isDarkMode ? 'bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800/50' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}><Check size={16}/> Present</button>
           <button onClick={()=>markAttendance('absent')} className={`flex-1 flex items-center justify-center gap-1 py-2.5 font-bold rounded-xl transition-colors ${isDarkMode ? 'bg-red-900/50 text-red-400 hover:bg-red-800/50' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}><X size={16}/> Absent</button>
         </div>
         <div className={`max-h-40 overflow-auto divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-100'}`}>
            {selectedStudentForAttendance?.attendanceRecords?.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map((r,i)=>(
              <div key={i} className={`py-2 flex justify-between items-center ${theme.textMain}`}><span className="font-medium text-sm">{r.date}</span><div className="flex gap-3 items-center"><span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${r.status==='present'?(isDarkMode?'bg-emerald-900/50 text-emerald-400':'bg-emerald-100 text-emerald-700'):(isDarkMode?'bg-red-900/50 text-red-400':'bg-red-100 text-red-700')}`}>{r.status}</span><button onClick={()=>deleteAttendanceRecord(r)}><Trash2 size={14} className="text-slate-400 hover:text-red-500"/></button></div></div>
            ))}
         </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} title={editingId ? "Edit Student" : "Add Student"}>
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          {!editingId && (
            <div className={`flex p-1 rounded-xl mb-4 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
              <button type="button" onClick={()=>setFormData(p=>({...p,program:'pemulihan'}))} className={`flex-1 py-2 font-bold rounded-lg transition-all ${formData.program==='pemulihan'?(isDarkMode ? 'bg-slate-700 shadow-sm text-indigo-400' : 'bg-white shadow-sm text-indigo-600'):(isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>Pemulihan</button>
              <button type="button" onClick={()=>setFormData(p=>({...p,program:'mbk'}))} className={`flex-1 py-2 font-bold rounded-lg transition-all ${formData.program==='mbk'?(isDarkMode ? 'bg-slate-700 shadow-sm text-indigo-400' : 'bg-white shadow-sm text-indigo-600'):(isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>MBK & OKU</button>
            </div>
          )}
          
          <div className={`flex flex-col items-center p-4 border-2 border-dashed rounded-2xl ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <Avatar name={formData.name||'Student'} photoUrl={formData.photoUrl} size="w-16 h-16"/>
            <label className={`font-bold cursor-pointer mt-3 flex items-center gap-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}><Camera size={14}/> {formData.photoUrl?'Change':'Upload'} Photo<input type="file" hidden accept="image/*" onChange={e=>handleImageUpload(e,'profile')}/></label>
            {formData.photoUrl && <div className="flex gap-3 mt-2"><button type="button" onClick={()=>{setRawImageSrc(formData.photoUrl);setUploadType('profile');}} className="text-xs text-indigo-500 hover:underline font-bold">Adjust</button><button type="button" onClick={()=>handleRemovePhoto('profile')} className="text-xs text-red-500 hover:underline font-bold">Remove</button></div>}
          </div>

          <div><label className={`block font-bold mb-1 ${theme.textMuted}`}>Full Name</label><input required placeholder="Full Name" className={`w-full p-2.5 border rounded-xl focus:outline-none ${theme.input}`} value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})}/></div>
          
          <div>
            <label className={`block font-bold mb-1 ${theme.textMuted}`}>Gender</label>
            <div className={`flex gap-6 p-2.5 border rounded-xl ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}><label className={`flex items-center gap-2 ${theme.textMain}`}><input type="radio" checked={formData.gender==='Lelaki'} onChange={()=>setFormData({...formData,gender:'Lelaki'})}/> Lelaki</label><label className={`flex items-center gap-2 ${theme.textMain}`}><input type="radio" checked={formData.gender==='Perempuan'} onChange={()=>setFormData({...formData,gender:'Perempuan'})}/> Perempuan</label></div>
          </div>

          {formData.program === 'pemulihan' ? (
            <>
              <div><label className={`block font-bold mb-1 ${theme.textMuted}`}>IC Number (for auto-year)</label><input placeholder="e.g. 1605..." className={`w-full p-2.5 border rounded-xl font-mono focus:outline-none ${theme.input}`} value={formData.ic} onChange={e=>setFormData({...formData,ic:e.target.value.replace(/\D/g,'')})} maxLength={12}/></div>
              <div><label className={`block font-bold mb-1 ${theme.textMuted}`}>Class</label><input required placeholder="e.g. 2 Hebat" className={`w-full p-2.5 border rounded-xl font-mono focus:outline-none ${theme.input}`} value={formData.className} onChange={handleClassNameChange}/></div>
              <div><label className={`block font-bold mb-1 ${theme.textMuted}`}>Subject</label><select className={`w-full p-2.5 border rounded-xl focus:outline-none ${theme.input}`} value={formData.subject} onChange={e=>setFormData({...formData,subject:e.target.value})}>{subjects.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
              <label className={`flex items-center gap-2 font-bold p-3 border rounded-xl ${isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}><input type="checkbox" checked={formData.isNewStudent} onChange={e=>setFormData({...formData,isNewStudent:e.target.checked})} className="w-4 h-4"/> Murid Baru (插班生)</label>
            </>
          ) : (
            <>
              <div><label className={`block font-bold mb-1 ${theme.textMuted}`}>Category</label><div className={`flex gap-6 p-2.5 border rounded-xl ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}><label className={`flex items-center gap-2 ${theme.textMain}`}><input type="radio" checked={formData.mbkType==='MBK'} onChange={()=>setFormData({...formData,mbkType:'MBK'})}/> MBK (Tiada Kad)</label><label className={`flex items-center gap-2 ${theme.textMain}`}><input type="radio" checked={formData.mbkType==='OKU'} onChange={()=>setFormData({...formData,mbkType:'OKU'})}/> OKU (Ada Kad)</label></div></div>
              <div><label className={`block font-bold mb-1 ${theme.textMuted}`}>MyKid / IC</label><input required placeholder="e.g. 1605..." className={`w-full p-2.5 border rounded-xl font-mono focus:outline-none ${theme.input}`} value={formData.ic} onChange={e=>setFormData({...formData,ic:e.target.value.replace(/\D/g,'')})} maxLength={12}/></div>
              <div><label className={`block font-bold mb-1 ${theme.textMuted}`}>Remarks</label><textarea placeholder="Remarks..." className={`w-full p-2.5 border rounded-xl focus:outline-none ${theme.input}`} rows="2" value={formData.remarks} onChange={e=>setFormData({...formData,remarks:e.target.value})}/></div>
              <div><label className={`block font-bold mb-1 ${theme.textMuted}`}>Doc Link</label><input placeholder="https://..." className={`w-full p-2.5 border rounded-xl focus:outline-none ${theme.input}`} value={formData.docLink} onChange={e=>setFormData({...formData,docLink:e.target.value})}/></div>
              
              {formData.mbkType === 'OKU' && (
                <div className={`p-4 border rounded-xl flex items-center justify-between ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`font-bold flex items-center gap-2 ${theme.textMain}`}><QrCode size={16}/> Kad OKU QR</span>
                  <div className="flex items-center gap-3">
                    {formData.qrCodeUrl && <button type="button" onClick={()=>handleRemovePhoto('qr')} className="text-red-500 text-xs hover:underline font-bold">Remove</button>}
                    <label className={`px-4 py-2 rounded-lg cursor-pointer font-bold text-xs transition-colors ${isDarkMode ? 'bg-indigo-900/50 text-indigo-400 hover:bg-indigo-800' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>Upload<input type="file" hidden accept="image/*" onChange={e=>handleImageUpload(e,'qr')}/></label>
                  </div>
                </div>
              )}
            </>
          )}
          <div className="flex gap-3 pt-4"><button type="button" onClick={()=>setIsModalOpen(false)} className={`flex-1 py-3 font-bold rounded-xl transition-colors ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Cancel</button><button type="submit" className="flex-1 py-3 text-white font-bold rounded-xl shadow-sm bg-indigo-600 hover:bg-indigo-700">Save</button></div>
        </form>
      </Modal>
    </div>
  );
}
