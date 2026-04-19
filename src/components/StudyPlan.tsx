import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserProfile, StudySession } from '../types';
import { 
  Target, 
  Clock, 
  Bell, 
  Calendar, 
  History, 
  CheckCircle2,
  Trophy,
  Timer,
  Settings
} from 'lucide-react';
import { motion } from 'motion/react';
import { format, subDays, startOfDay } from 'date-fns';
import { cn } from '../lib/utils';

const StudyPlan: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const [goal, setGoal] = useState(profile?.studyGoalMinutes || 15);
  const [notificationTime, setNotificationTime] = useState(profile?.notificationTime || '08:00');
  const [isUpdating, setIsUpdating] = useState(false);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isStudying, setIsStudying] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (isStudying && startTime) {
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isStudying, startTime]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'users', auth.currentUser.uid, 'sessions'));
    const snap = await getDocs(q);
    const fetched: StudySession[] = [];
    snap.forEach(doc => fetched.push({ id: doc.id, ...doc.data() } as StudySession));
    setSessions(fetched.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
  };

  const updateSettings = async () => {
    if (!auth.currentUser) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        studyGoalMinutes: goal,
        notificationTime: notificationTime
      });
      alert('Configurações salvas!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const startSession = () => {
    setIsStudying(true);
    setStartTime(Date.now());
    setElapsed(0);
  };

  const stopSession = async () => {
    if (!startTime || !auth.currentUser) return;
    const duration = Math.floor((Date.now() - startTime) / 60000); // Minutes
    if (duration > 0) {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'sessions'), {
        userId: auth.currentUser.uid,
        startTime: new Date(startTime).toISOString(),
        durationMinutes: duration
      });
      fetchSessions();
    }
    setIsStudying(false);
    setStartTime(null);
    setElapsed(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const todayMinutes = sessions
    .filter(s => new Date(s.startTime).toDateString() === new Date().toDateString())
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  const progress = Math.min(100, (todayMinutes / goal) * 100);

  return (
    <div className="space-y-8 pb-12">
      <header className="mb-8">
        <h2 className="text-4xl font-black text-stone-900 tracking-tighter uppercase mb-2">Cronograma de Estudo</h2>
        <p className="text-stone-500 italic">Mantenha sua meta diária de imersão nas escrituras.</p>
      </header>

      {/* Timer Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-stone-900 text-white rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 opacity-10 p-8">
          <Timer size={160} />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-stone-400 mb-6 flex items-center gap-2">
            <Clock size={16} /> Sessão Atual
          </h3>
          
          <div className="text-7xl md:text-8xl font-mono font-light tracking-tighter mb-8">
            {isStudying ? formatTime(elapsed) : '00:00'}
          </div>

          <button
            onClick={isStudying ? stopSession : startSession}
            className={cn(
              "px-10 py-4 rounded-full text-lg font-bold transition-all transform hover:scale-105 active:scale-95",
              isStudying 
                ? "bg-red-500 hover:bg-red-600 text-white" 
                : "bg-white text-stone-900 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            )}
          >
            {isStudying ? 'Encerrar Sessão' : 'Iniciar Estudo'}
          </button>
        </div>
      </motion.div>

      {/* Progress & Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-stone-200 p-8 rounded-[2rem] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Target className="text-stone-400" />
            <h3 className="text-xl font-bold text-stone-800">Progresso Diário</h3>
          </div>
          
          <div className="flex items-end justify-between mb-2">
            <span className="text-4xl font-bold text-stone-900">{todayMinutes}<span className="text-lg font-normal text-stone-400 ml-1">/ {goal} min</span></span>
            <span className="text-sm font-bold text-stone-400 uppercase tracking-widest">{Math.round(progress)}%</span>
          </div>
          
          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden mb-6">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-stone-800"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 bg-stone-50 p-4 rounded-2xl border border-stone-100 flex items-center gap-3">
              <Trophy className="text-amber-500" size={24} />
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Recorde</p>
                <p className="text-lg font-bold text-stone-800">7 dias</p>
              </div>
            </div>
            <div className="flex-1 bg-stone-50 p-4 rounded-2xl border border-stone-100 flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={24} />
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Status</p>
                <p className="text-lg font-bold text-stone-800">{progress >= 100 ? 'Meta ok' : 'Faltam ' + (goal - todayMinutes) + 'm'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-8 rounded-[2rem] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="text-stone-400" />
            <h3 className="text-xl font-bold text-stone-800">Configurações</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Meta Diária (minutos)</label>
              <input 
                type="number" 
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value))}
                className="w-full p-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2 flex items-center justify-between">
                Lembrete Diário
                <span className="text-[10px] text-stone-400 font-normal italic lowercase">(notificação 10 min antes)</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-stone-50 border border-stone-100 rounded-xl flex-1 flex items-center gap-2">
                  <Bell size={18} className="text-stone-400" />
                  <input 
                    type="time" 
                    value={notificationTime}
                    onChange={(e) => setNotificationTime(e.target.value)}
                    className="bg-transparent focus:outline-none flex-1 font-medium"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={updateSettings}
              disabled={isUpdating}
              className="w-full bg-stone-800 text-white py-3 rounded-xl font-bold hover:bg-stone-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>

      {/* Sessions History */}
      <div className="bg-white border border-stone-200 p-8 rounded-[2rem] shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <History className="text-stone-400" />
          <h3 className="text-xl font-bold text-stone-800">Histórico Recente</h3>
        </div>
        
        <div className="space-y-3">
          {sessions.slice(0, 5).map((s, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
              <div className="flex items-center gap-3 text-stone-600">
                <Calendar size={18} />
                <span className="font-medium">{new Date(s.startTime).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-800 font-bold">
                <Clock size={16} />
                {s.durationMinutes} min
              </div>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-center text-stone-400 py-4">Nenhum estudo registrado ainda.</p>}
        </div>
      </div>
    </div>
  );
};

export default StudyPlan;
