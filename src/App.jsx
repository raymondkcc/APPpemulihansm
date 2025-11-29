import React, { useState, useEffect, useMemo } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
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

// --- Components ---

const Avatar = ({ name, color, photoUrl, size = "w-12 h-12" }) => {
  if (photoUrl) {
    return (
      <img 
        src={photoUrl} 
        alt={name} 
        className={`${size} rounded-full object-cover shadow-sm border-2 border-white ring-1 ring-gray-100 flex-shrink-0 bg-white`} 
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
    <div className={`${size} rounded-full flex items-center justify-center text-white font-bold shadow-sm border-2 border-white ring-1 ring-gray-100 ${color} flex-shrink-0`}>
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
  const icStr = String(ic);
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
  if (icYear !== null) return icYear;
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
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', month: 'short', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
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
    name: '', program: 'pemulihan', className: '', subject: 'Pemulihan BM', ic: '', gender: '', mbkType: 'MBK', status: 'Active', photoUrl: ''
  });

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
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) { console.error("Auth error:", error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
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

  // Centralized Tab Change Handler to prevent filter pollution
  const handleTabChange = (tabId) => {
    setCurrentSection(tabId);
    // Reset all shared filters to safe defaults
    setProfileYearFilter('All');
    setClassFilter('All');
    setSubjectFilter('All');
    // MBK specific reset if needed (though ProfileYearFilter handles simple search there too)
    if (tabId === 'mbk') setProfileYearFilter(''); 
  };

  const handleRoleSwitch = (targetRole) => {
    if (targetRole === 'admin') {
      if (role !== 'admin') setShowAdminLogin(true);
    } else {
      setRole('user');
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'BBC9404') {
      setRole('admin'); setShowAdminLogin(false); setAdminPassword(''); setLoginError('');
    } else {
      setLoginError('Incorrect password.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image is too large. Please choose an image under 5MB."); return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width; let height = img.height;
          const MAX_DIMENSION = 800;
          if (width > height) { if (width > MAX_DIMENSION) { height *= MAX_DIMENSION / width; width = MAX_DIMENSION; } } 
          else { if (height > MAX_DIMENSION) { width *= MAX_DIMENSION / height; height = MAX_DIMENSION; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          setFormData(prev => ({ ...prev, photoUrl: canvas.toDataURL('image/jpeg', 0.7) }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user || !db) return;
    
    // NEW: Validate Gender
    if (!formData.gender) {
      alert("Please select a gender (Jantina) before saving.");
      return;
    }

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    try {
      const dataToSave = {
        name: formData.name, program: formData.program, gender: formData.gender, status: formData.status,
        photoUrl: formData.photoUrl || '', updatedAt: serverTimestamp(), ic: formData.ic || ''
      };
      
      if (formData.program === 'pemulihan') {
        dataToSave.className = formData.className; 
        dataToSave.subject = formData.subject;
      } else {
        dataToSave.mbkType = formData.mbkType; 
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
      subject: student.subject || 'Pemulihan BM', ic: student.ic || '', gender: student.gender || '', // Gender empty by default if editing new but usually populated
      mbkType: student.mbkType || 'MBK', status: student.status || 'Active', photoUrl: student.photoUrl || ''
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
    setFormData({ name: '', program: 'pemulihan', className: '', subject: 'Pemulihan BM', ic: '', gender: '', mbkType: 'MBK', status: 'Active', photoUrl: '' });
  };

  const exportToCSV = () => {
    const headers = ["ID,Name,Program,IC,Gender,MBK_Type,Class,Subject,Status,GraduationDate"];
    const rows = filteredStudents.map(s => {
      return `${s.id},"${s.name}","${s.program || 'pemulihan'}",${s.ic || ''},${s.gender || 'Lelaki'},${s.mbkType || ''},"${s.className || ''}",${s.subject || ''},${s.status || 'Active'},${s.graduationDate || ''}`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `students_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Grouping for Profile (Year 1-3)
  const groupedProfileStudents = useMemo(() => {
    if (currentSection !== 'profile') return {};
    
    const profileStudents = students.filter(s => {
      const program = s.program || 'pemulihan';
      if (program !== 'pemulihan') return false; 
      if (s.status === 'Lulus') return false;
      
      const studentYear = getStudentCurrentYear(s);
      // Logic: Only show Year 1, 2, 3
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

  // Grouping for PLaN (Year 4-6)
  const groupedPlanStudents = useMemo(() => {
    if (currentSection !== 'plan') return {};

    const planStudents = students.filter(s => {
      const program = s.program || 'pemulihan';
      if (program !== 'pemulihan') return false;
      if (s.status === 'Lulus') return false;

      const studentYear = getStudentCurrentYear(s);
      // Logic: Only show Year 4, 5, 6
      if (studentYear < 4 || studentYear > 6) return false;

      return true; // PLaN ignores typical profile filters for simplicity, or we can add them back
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
    const lulusStudents = students.filter(s => s.status === 'Lulus' && (!s.program || s.program === 'pemulihan') && (profileYearFilter === 'All' || getYearFromClassString(s.className) === parseInt(profileYearFilter)) && (subjectFilter === 'All' || s.subject === subjectFilter));
    lulusStudents.forEach(student => {
      const currentYearNum = calculateCurrentLulusYear(student.className, student.graduationDate);
      const groupKey = `Tahun ${currentYearNum}`;
      if (!groups[groupKey]) groups[groupKey] = { yearNum: currentYearNum, students: [] };
      groups[groupKey].students.push(student);
    });
    return groups;
  }, [students, currentSection, profileYearFilter, subjectFilter]);

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

      if (currentSection === 'stats') {
        if (program === 'mbk') return false;
        // SAFE TYPE CHECKING FOR STATS
        const studentYear = getYearFromClassString(s.className);
        const filterYear = parseInt(statsFilters.year);
        const matchYear = statsFilters.year === 'All' || (studentYear !== null && studentYear === filterYear);
        const matchGender = statsFilters.gender === 'All' || s.gender === statsFilters.gender;
        const matchSubject = statsFilters.subject === 'All' || s.subject === statsFilters.subject;
        return matchYear && matchGender && matchSubject;
      }
      return false;
    });
  }, [students, profileYearFilter, subjectFilter, currentSection, statsFilters]);

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

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 font-sans selection:bg-indigo-100 pb-24">
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
          <div className="sm:hidden w-full">
            <div className="relative">
              <select
                className="block w-full appearance-none rounded-xl border-slate-200 bg-white py-3 pl-4 pr-10 text-base font-bold text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={currentSection}
                onChange={(e) => handleTabChange(e.target.value)}
              >
                <option value="profile">Profile Pemulihan (Thn 1-3)</option>
                <option value="plan">PLaN (Thn 4-6)</option>
                <option value="mbk">Murid MBK & OKU</option>
                <option value="lulus">Lulus Pemulihan</option>
                <option value="stats">Statistik</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500"><Menu size={20} /></div>
            </div>
          </div>
          <div className="hidden sm:inline-flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 gap-1">
            {[{ id: 'profile', label: 'Profile Pemulihan' }, { id: 'plan', label: 'PLaN' }, { id: 'mbk', label: 'Murid MBK & OKU' }, { id: 'lulus', label: 'Lulus' }, { id: 'stats', label: 'Statistik' }].map(tab => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 whitespace-nowrap ${currentSection === tab.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>{tab.label}</button>
            ))}
          </div>
        </div>

        {currentSection === 'profile' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row gap-4 mb-8 justify-between items-start lg:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative group">
                  <select className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-bold text-sm appearance-none transition-colors hover:bg-slate-100 cursor-pointer" value={profileYearFilter} onChange={(e) => setProfileYearFilter(e.target.value)}>
                    {availableYears.map(y => <option key={y} value={y}>{y === 'All' ? 'Filter: All Years' : `Tahun ${y}`}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none group-hover:text-slate-600" />
                </div>
                <div className="relative group">
                  <select className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-bold text-sm appearance-none transition-colors hover:bg-slate-100 cursor-pointer" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                    {availableClasses.map(c => <option key={c} value={c}>{c === 'All' ? 'Filter: All Classes' : c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none group-hover:text-slate-600" />
                </div>
                <div className="relative group">
                  <select className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-bold text-sm appearance-none transition-colors hover:bg-slate-100 cursor-pointer" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                    <option value="All">Filter: All Subjects</option>
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
                <button onClick={exportToCSV} className="flex-1 lg:flex-none flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-blue-600 font-bold bg-white px-5 py-2.5 border border-slate-200 rounded-xl hover:border-blue-200 hover:shadow-md transition-all"><Download size={18} /> Export CSV</button>
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
                        <div key={student.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-slate-300 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden flex flex-col sm:flex-row lg:flex-col items-center p-3 gap-4">
                          <div className={`absolute top-0 left-0 w-full sm:w-1.5 lg:w-full h-1.5 sm:h-full lg:h-1.5 ${studentStats.percent >= 75 ? 'bg-gradient-to-r sm:bg-gradient-to-b lg:bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r sm:bg-gradient-to-b lg:bg-gradient-to-r from-amber-400 to-amber-600'}`}></div>
                          
                          <Avatar name={student.name} color={student.color || 'bg-blue-500'} photoUrl={student.photoUrl} size="w-20 h-20" />
                          
                          <div className="flex-1 w-full text-center sm:text-left lg:text-center">
                             <div className="flex items-center justify-center sm:justify-start lg:justify-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{className}</span>
                             </div>
                            <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1 line-clamp-1">{student.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">{student.gender || 'Lelaki'}</p>
                            
                            <div className={`flex items-center justify-center text-[10px] font-bold text-white px-2 py-0.5 rounded-md uppercase tracking-wide mb-2 shadow-sm ${getSubjectBadgeColor(student.subject)}`}>{student.subject}</div>

                            <div className="flex flex-col gap-1 w-full">
                               <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                                 <span>Attendance</span>
                                 <span className={studentStats.percent >= 75 ? 'text-emerald-600' : 'text-amber-600'}>{studentStats.percent}%</span>
                               </div>
                               <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"><div className={`h-full rounded-full ${studentStats.percent >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${studentStats.percent}%` }}></div></div>
                            </div>
                            
                            <div className="mt-2 text-[10px] text-slate-400 text-center sm:text-left lg:text-center font-medium">
                              Updated: {student.updatedAt ? formatDate(student.updatedAt) : 'New'}
                            </div>
                          </div>

                          {role === 'admin' && (
                            <>
                              <div className="hidden sm:flex flex-col absolute top-2 right-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg backdrop-blur-sm shadow-sm">
                                <button onClick={() => openNotesModal(student)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded"><StickyNote size={14} /></button>
                                <button onClick={() => openAttendanceModal(student)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Calendar size={14} /></button>
                                <button onClick={() => openEdit(student)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded"><Edit2 size={14} /></button>
                                <button onClick={() => toggleStudentStatus(student)} className="p-1.5 text-purple-500 hover:bg-purple-50 rounded"><ArrowRight size={14} /></button>
                                <button onClick={() => confirmDelete(student)} className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                              </div>
                              <div className="sm:hidden w-full mt-2 pt-2 border-t border-slate-50 flex justify-around">
                                <button onClick={() => openNotesModal(student)} className="p-2 text-amber-500 bg-slate-100 rounded-lg"><StickyNote size={18} /></button>
                                <button onClick={() => openAttendanceModal(student)} className="p-2 text-blue-500 bg-slate-100 rounded-lg"><Calendar size={18} /></button>
                                <button onClick={() => openEdit(student)} className="p-2 text-slate-400 bg-slate-100 rounded-lg"><Edit2 size={18} /></button>
                                <button onClick={() => toggleStudentStatus(student)} className="p-2 text-purple-500 bg-slate-100 rounded-lg"><ArrowRight size={18} /></button>
                                <button onClick={() => confirmDelete(student)} className="p-2 text-red-400 bg-slate-100 rounded-lg"><Trash2 size={18} /></button>
                              </div>
                            </>
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
        
        {/* ... Other views ... */}
        
        {currentSection === 'plan' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* ... Plan View Implementation ... */}
             {/* Using same structure as Profile View but with groupedPlanStudents */}
             <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight">PLaN (Thn 4-6)</h2>
              <div className="flex gap-2 items-center">
                 {lastUpdatedString && (
                  <span className="text-xs font-bold text-blue-400 bg-blue-50 px-3 py-1.5 rounded-lg hidden md:inline-block">
                    Last updated: {lastUpdatedString}
                  </span>
                )}
                <button onClick={exportToCSV} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 font-bold bg-white px-5 py-2.5 border border-slate-200 rounded-xl hover:border-blue-200 hover:shadow-md transition-all"><Download size={18} /> Export CSV</button>
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
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {groupedPlanStudents[groupKey].map(student => (
                         <div key={student.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col relative group">
                           {/* Card Content */}
                           <div className="flex items-center gap-4 mb-4">
                            <Avatar name={student.name} color={student.color} photoUrl={student.photoUrl} size="w-16 h-16" />
                            <div><h4 className="font-bold text-slate-900 text-base leading-tight mb-1">{student.name}</h4><span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{student.gender}</span></div>
                          </div>
                          
                          {role === 'admin' && (
                            <>
                              <div className="hidden sm:flex absolute top-4 right-4 gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg backdrop-blur-sm shadow-sm">
                                 <button onClick={() => openNotesModal(student)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded transition-colors"><StickyNote size={16} /></button>
                                 <button onClick={() => confirmDelete(student)} className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                              </div>
                              <div className="sm:hidden w-full mt-4 pt-4 border-t border-slate-50 flex justify-around">
                                 <button onClick={() => openNotesModal(student)} className="p-2 text-amber-500 bg-slate-100 rounded-lg"><StickyNote size={18} /></button>
                                 <button onClick={() => confirmDelete(student)} className="p-2 text-red-400 bg-slate-100 rounded-lg"><Trash2 size={18} /></button>
                              </div>
                            </>
                          )}
                          <div className="mt-auto pt-4 border-t border-slate-50 flex flex-col gap-2">
                             <div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-400 uppercase tracking-wider">Subject</span><span className="font-semibold text-slate-700 text-right">{student.subject}</span></div>
                          </div>
                         </div>
                       ))}
                    </div>
                   </div>
                ))}
               </div>
            )}
          </div>
        )}

        {currentSection === 'mbk' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ... (Header) ... */}
            {/* ... (Student Mapping) ... */}
            {filteredStudents.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStudents.map(student => {
                  const year = calculateSchoolYearFromIC(student.ic);
                  return (
                  <div key={student.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 hover:-translate-y-1 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    <div className="flex justify-between items-start mb-6">
                      <Avatar name={student.name} color={student.color || 'bg-indigo-500'} photoUrl={student.photoUrl} size="w-20 h-20"/>
                      {role === 'admin' && (
                        <>
                          <div className="hidden sm:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(student)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                            <button onClick={() => confirmDelete(student)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2 leading-tight">{student.name}</h3>
                    {/* ... (Content) ... */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <button onClick={() => handleCheckOKU(student.ic)} className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-slate-900 hover:bg-indigo-600 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-indigo-200 active:scale-95"><ExternalLink size={16} /> Semakan OKU</button>
                    </div>
                    {role === 'admin' && (
                        <div className="sm:hidden w-full mt-4 pt-4 border-t border-slate-50 flex justify-around">
                           <button onClick={() => openEdit(student)} className="p-2 text-slate-400 bg-slate-100 rounded-lg"><Edit2 size={18} /></button>
                           <button onClick={() => confirmDelete(student)} className="p-2 text-red-400 bg-slate-100 rounded-lg"><Trash2 size={18} /></button>
                        </div>
                    )}
                  </div>
                )})}
              </div>
            )}
             {/* ... (Empty State) ... */}
           </div>
        )}

        {/* ... (Lulus & Stats Views remain same) ... */}
        {/* ... (Modals) ... */}
        
        {/* ... (Include all modals at bottom) ... */}
        <Modal isOpen={showAdminLogin} onClose={() => { setShowAdminLogin(false); setAdminPassword(''); setLoginError(''); }} title="Admin Login">
            {/* ... Login form ... */}
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
            {/* ... Move Form ... */}
            <div className="flex flex-col items-center justify-center mb-6 text-center"><div className="bg-blue-50 p-4 rounded-full mb-4"><ArrowLeftRight className="text-blue-600 w-10 h-10" /></div><h4 className="text-lg font-bold text-gray-900 mb-2">Move Student?</h4><p className="text-gray-500 mb-4">{moveConfirmation.newStatus === 'Lulus' ? `Mark ${moveConfirmation.student?.name} as "Lulus Pemulihan"?` : `Move ${moveConfirmation.student?.name} back to "Profile Murid Pemulihan"?`}</p>{moveConfirmation.newStatus === 'Lulus' && (<div className="w-full text-left bg-gray-50 p-3 rounded-lg border border-gray-200"><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Graduation Date</label><div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /><input type="date" className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-900 w-full p-0" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} /></div></div>)}</div>
            <div className="flex gap-3"><button onClick={() => setMoveConfirmation({ isOpen: false, student: null, newStatus: '' })} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button><button onClick={executeMove} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm">Confirm</button></div>
        </Modal>
        <Modal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} title="Catatan Murid">
            {/* ... Notes Form ... */}
            <div className="space-y-6"><div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg"><Avatar name={selectedStudentForNotes?.name || ''} color={selectedStudentForNotes?.color || 'bg-blue-500'} photoUrl={selectedStudentForNotes?.photoUrl}/><div><h4 className="font-bold text-gray-900">{selectedStudentForNotes?.name}</h4><p className="text-sm text-gray-500">{selectedStudentForNotes?.className}</p></div></div><form onSubmit={saveNote} className="space-y-3"><div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</label><input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" value={noteForm.date} onChange={(e) => setNoteForm({...noteForm, date: e.target.value})}/></div><div><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Catatan (Note)</label><textarea required rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" value={noteForm.text} onChange={(e) => setNoteForm({...noteForm, text: e.target.value})} placeholder="Enter note details here..."></textarea></div><button type="submit" className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium shadow-sm transition-colors">{noteForm.id ? 'Update Note' : 'Add Note'}</button></form><div className="border-t border-gray-100 pt-4"><h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Clock size={16} /> History</h5><div className="space-y-3 max-h-60 overflow-y-auto">{selectedStudentForNotes?.notes && selectedStudentForNotes.notes.length > 0 ? ([...selectedStudentForNotes.notes].sort((a, b) => new Date(b.date) - new Date(a.date)).map((note) => (<div key={note.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 relative group"><div className="flex justify-between items-start mb-1"><span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">{note.date}</span><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => startEditNote(note)} className="text-blue-600 hover:text-blue-800"><Edit2 size={14} /></button><button onClick={() => deleteNote(note.id)} className="text-red-600 hover:text-red-800"><Trash2 size={14} /></button></div></div><p className="text-sm text-gray-800 whitespace-pre-wrap">{note.text}</p></div>))) : (<p className="text-center text-sm text-gray-400 py-4">No notes recorded yet.</p>)}</div></div></div>
        </Modal>
        <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title="Manage Attendance">
            {/* ... Attendance Form ... */}
            <div className="space-y-6"><div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"><Avatar name={selectedStudentForAttendance?.name || ''} color={selectedStudentForAttendance?.color || 'bg-blue-500'} photoUrl={selectedStudentForAttendance?.photoUrl}/><div><h4 className="font-bold text-gray-900">{selectedStudentForAttendance?.name}</h4><p className="text-sm text-gray-500">{selectedStudentForAttendance?.className}</p></div></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Mark for specific date</label><div className="flex gap-2"><input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/><button onClick={() => markAttendance('present')} className="flex items-center gap-1 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 font-medium"><Check size={16} /> Present</button><button onClick={() => markAttendance('absent')} className="flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"><X size={16} /> Absent</button></div></div><div><h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock size={14} /> Record History</h5><div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">{selectedStudentForAttendance?.attendanceRecords?.length > 0 ? ([...selectedStudentForAttendance.attendanceRecords].sort((a, b) => new Date(b.date) - new Date(a.date)).map((record, idx) => (<div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50"><div className="text-sm"><span className="font-medium text-gray-700">{record.date}</span></div><div className="flex items-center gap-3"><span className={`text-xs font-bold px-2 py-1 rounded uppercase ${record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{record.status}</span><button onClick={() => deleteAttendanceRecord(record)} className="text-gray-400 hover:text-red-500" title="Delete entry"><Trash2 size={14} /></button></div></div>))) : (<div className="p-4 text-center text-sm text-gray-400">No records found.</div>)}</div></div></div>
        </Modal>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Student" : "Add New Student"}>
            {/* ... Edit/Add Form ... */}
            <form onSubmit={handleSave} className="space-y-4">{!editingId && (<div className="flex p-1 bg-gray-100 rounded-lg mb-4"><button type="button" className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.program === 'pemulihan' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setFormData(prev => ({ ...prev, program: 'pemulihan' }))}>Profile Pemulihan</button><button type="button" className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.program === 'mbk' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setFormData(prev => ({ ...prev, program: 'mbk' }))}>Murid MBK & OKU</button></div>)}<div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors"><div className="mb-3"><Avatar name={formData.name || 'User'} color="bg-gray-300" photoUrl={formData.photoUrl} size="w-20 h-20"/></div><label className="cursor-pointer"><span className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"><Camera size={16} /> {formData.photoUrl ? 'Change Photo' : 'Upload Photo'}</span><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /></label><p className="text-xs text-gray-400 mt-1">Max size 5MB</p></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Jane Doe"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Jantina (Gender)</label><div className="flex gap-4"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="gender" value="Lelaki" checked={formData.gender === 'Lelaki'} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="text-blue-600 focus:ring-blue-500"/><span className="text-sm text-gray-700">Lelaki</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="gender" value="Perempuan" checked={formData.gender === 'Perempuan'} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="text-blue-600 focus:ring-blue-500"/><span className="text-sm text-gray-700">Perempuan</span></label></div></div>{formData.program === 'pemulihan' ? (<><div><label className="block text-sm font-medium text-gray-700 mb-1">IC Number (Optional but Recommended)</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm" value={formData.ic} onChange={(e) => setFormData({ ...formData, ic: e.target.value.replace(/\D/g, '') })} placeholder="For Auto-Year Calculation (e.g. 16...)" maxLength={12}/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label><input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm" value={formData.className} onChange={handleClassNameChange} placeholder="e.g. 2 He"/><p className="text-xs text-gray-400 mt-1">Format: Year ClassName (e.g. 2 He)</p></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Subject</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })}>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select></div></>) : (<><div><label className="block text-sm font-medium text-gray-700 mb-1">Kategori (Category)</label><div className="flex gap-4"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="mbkType" value="MBK" checked={formData.mbkType === 'MBK'} onChange={(e) => setFormData({ ...formData, mbkType: e.target.value })} className="text-amber-600 focus:ring-amber-500"/><span className="text-sm text-gray-700">MBK (Tiada Kad)</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="mbkType" value="OKU" checked={formData.mbkType === 'OKU'} onChange={(e) => setFormData({ ...formData, mbkType: e.target.value })} className="text-green-600 focus:ring-green-500"/><span className="text-sm text-gray-700">OKU (Ada Kad)</span></label></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">MyKid / IC Number</label><input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm" value={formData.ic} onChange={(e) => setFormData({ ...formData, ic: e.target.value.replace(/\D/g, '') })} placeholder="e.g. 160520101234" maxLength={12}/><p className="text-xs text-gray-400 mt-1">System will auto-calculate School Year based on first 2 digits.</p></div></>)}<div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button><button type="submit" className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm ${formData.program === 'mbk' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{editingId ? 'Save Changes' : 'Add Student'}</button></div></form>
        </Modal>

    </div>
  );
}
