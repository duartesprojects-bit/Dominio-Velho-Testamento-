import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, getDocs } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logOut } from './lib/firebase';
import { UserProfile, Scripture } from './types';
import { 
  BookOpen, 
  Settings, 
  Calendar, 
  Heart, 
  FileText, 
  User as UserIcon, 
  LogOut, 
  ChevronRight,
  Plus,
  ShieldCheck,
  Bell,
  Gamepad2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Components
import Home from './components/Home';
import ScriptureDetails from './components/ScriptureDetails';
import StudyPlan from './components/StudyPlan';
import Favorites from './components/Favorites';
import Notes from './components/Notes';
import AdminPanel from './components/AdminPanel';
import MemoryGames from './components/MemoryGames';
import GameSelection from './components/GameSelection';
import AuthGuard from './components/AuthGuard';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Usuário',
              studyGoalMinutes: 15,
              notificationTime: '08:00',
              isAdmin: false,
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setProfile(newProfile);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Firebase auth/profile error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-stone-800"
        >
          <BookOpen size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-amber-100 flex flex-col md:flex-row overflow-x-hidden">
        <Sidebar user={user} profile={profile} />
        
        <div className="flex-1 flex flex-col h-screen overflow-y-auto">
          <header className="h-16 md:h-20 px-4 md:px-10 flex items-center justify-between border-b border-stone-200 bg-stone-50/50 backdrop-blur-md sticky top-0 z-40">
            <div>
              <h2 className="text-stone-800 font-medium">
                {user ? `Bem-vindo, ${user.displayName?.split(' ')[0]}` : 'Bem-vindo ao Logos OT'}
              </h2>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] md:text-xs text-stone-400 font-medium font-sans uppercase tracking-wider">Sistema Online</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {!user && (
                <button
                  onClick={signInWithGoogle}
                  className="bg-stone-900 text-white px-6 py-2 rounded-full text-xs font-bold hover:bg-stone-800 transition-all shadow-md"
                >
                  ENTRAR
                </button>
              )}
              {user && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-200 border-2 border-white shadow-sm overflow-hidden hidden sm:block">
                    {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-stone-400">?</div>}
                  </div>
                  <button 
                    onClick={logOut}
                    className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
                    title="Sair"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 p-4 md:p-10">
            <div className="max-w-5xl mx-auto">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/scripture/:id" element={<ScriptureDetails />} />
                <Route path="/games/:id" element={<MemoryGames />} />
                <Route path="/games" element={<GameSelection />} />
                <Route path="/plan" element={<AuthGuard user={user}><StudyPlan profile={profile} /></AuthGuard>} />
                <Route path="/favorites" element={<AuthGuard user={user}><Favorites /></AuthGuard>} />
                <Route path="/notes" element={<AuthGuard user={user}><Notes /></AuthGuard>} />
                <Route path="/admin" element={<AuthGuard user={user} isAdmin={profile?.isAdmin}><AdminPanel /></AuthGuard>} />
              </Routes>
            </div>
          </main>
        </div>

        <NotificationHandler profile={profile} />
      </div>
    </Router>
  );
}

function Sidebar({ user, profile }: { user: User | null, profile: UserProfile | null }) {
  const location = useLocation();

  const navItems = [
    { label: 'Escrituras', path: '/', icon: BookOpen },
    { label: 'Jogos', path: '/games', icon: Gamepad2 },
    { label: 'Cronograma', path: '/plan', icon: Calendar },
    { label: 'Favoritos', path: '/favorites', icon: Heart },
    { label: 'Notas', path: '/notes', icon: FileText },
  ];

  if (profile?.isAdmin) {
    navItems.push({ label: 'Painel Admin', path: '/admin', icon: ShieldCheck });
  }

  return (
    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-stone-200 bg-white flex flex-col h-auto md:h-screen">
      <div className="p-6 md:p-8">
        <h1 className="text-xl font-serif font-bold tracking-tight text-amber-900">Domínio VT</h1>
        <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1 font-sans">Escrituras do Velho Testamento</p>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 flex md:flex-col items-center md:items-stretch overflow-x-auto md:overflow-x-visible">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-sans text-sm min-w-max md:min-w-0 transition-all duration-300",
              location.pathname === item.path 
                ? "bg-stone-100 text-stone-900 font-bold shadow-sm" 
                : "text-stone-400 hover:bg-stone-50 hover:text-stone-600"
            )}
          >
            <item.icon size={20} weight={location.pathname === item.path ? "bold" : "regular"} />
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        ))}
      </nav>

      {profile && (
        <div className="p-6 border-t border-stone-100 hidden md:block">
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Estudo Hoje</span>
              <span className="text-[10px] font-bold text-amber-700">Meta {profile.studyGoalMinutes}m</span>
            </div>
            <div className="w-full bg-amber-200/50 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "65%" }} // Using a dummy progress for layout
                className="bg-amber-600 h-full rounded-full"
              />
            </div>
          </div>
        </div>
      )}

      {user && (
        <div className="p-6 flex items-center space-x-3 border-t border-stone-100 hidden md:flex">
          <div className="w-10 h-10 bg-stone-100 rounded-full flex-shrink-0 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
             {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <div className="text-stone-300"><UserIcon size={20} /></div>}
          </div>
          <div className="truncate">
            <p className="text-sm font-bold text-stone-900 truncate">{user.displayName}</p>
            <p className="text-[10px] text-stone-400 font-sans uppercase tracking-widest">{profile?.isAdmin ? 'ADMINISTRADOR' : 'ESTUDANTE'}</p>
          </div>
        </div>
      )}
    </aside>
  );
}

function NotificationHandler({ profile }: { profile: UserProfile | null }) {
  const [showNotification, setShowNotification] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!profile) return;

    const checkNotifications = () => {
      const now = new Date();
      const [hours, minutes] = profile.notificationTime.split(':').map(Number);
      
      const targetTime = new Date();
      targetTime.setHours(hours, minutes, 0, 0);

      // 10 minutes before notification time
      const tenMinutesBefore = new Date(targetTime.getTime() - 10 * 60000);

      const currentTimeString = now.toTimeString().slice(0, 5);
      const targetTimeString = targetTime.toTimeString().slice(0, 5);
      const reminderTimeString = tenMinutesBefore.toTimeString().slice(0, 5);

      if (currentTimeString === reminderTimeString) {
        setMessage("Lembrete: Seu estudo começa em 10 minutos!");
        setShowNotification(true);
      } else if (currentTimeString === targetTimeString) {
        setMessage("Hora de estudar o Velho Testamento!");
        setShowNotification(true);
      }
    };

    const interval = setInterval(checkNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [profile]);

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 z-[100] bg-white border border-stone-200 p-4 rounded-2xl shadow-xl max-w-sm flex gap-4 items-start"
        >
          <div className="bg-stone-100 p-2 rounded-full text-stone-600">
            <Bell size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-stone-800">Estudo das Escrituras</h4>
            <p className="text-sm text-stone-600 mt-1">{message}</p>
            <button 
              onClick={() => setShowNotification(false)}
              className="mt-3 text-xs font-bold text-stone-400 hover:text-stone-800 uppercase tracking-wider"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
