import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Scripture, UserNote, Favorite } from '../types';
import { 
  Heart, 
  ChevronLeft, 
  Share2, 
  Edit3, 
  Save, 
  Trash2,
  BookOpen,
  Info,
  Lightbulb,
  Globe,
  User as UserIcon,
  Quote,
  Gamepad2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import initialScriptures from '../initial_scriptures.json';

const ScriptureDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scripture, setScripture] = useState<Scripture | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [note, setNote] = useState('');
  const [noteId, setNoteId] = useState<string | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      
      // Load scripture data
      try {
        const scDoc = await getDoc(doc(db, 'scriptures', id));
        if (scDoc.exists()) {
          setScripture({ id: scDoc.id, ...scDoc.data() } as Scripture);
        } else {
          const fallback = (initialScriptures as Scripture[]).find(s => s.id === id);
          if (fallback) setScripture(fallback);
        }

        // Load user specific data if logged in
        if (auth.currentUser) {
          const uid = auth.currentUser.uid;
          
          // Favorite check
          const favQuery = query(collection(db, 'users', uid, 'favorites'), where('scriptureId', '==', id));
          const favSnap = await getDocs(favQuery);
          if (!favSnap.empty) {
            setIsFavorite(true);
            setFavoriteId(favSnap.docs[0].id);
          }

          // Note check
          const noteQuery = query(collection(db, 'users', uid, 'notes'), where('scriptureId', '==', id));
          const noteSnap = await getDocs(noteQuery);
          if (!noteSnap.empty) {
            setNote(noteSnap.docs[0].data().content);
            setNoteId(noteSnap.docs[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const toggleFavorite = async () => {
    if (!auth.currentUser || !id) return;
    const uid = auth.currentUser.uid;
    
    try {
      if (isFavorite && favoriteId) {
        await deleteDoc(doc(db, 'users', uid, 'favorites', favoriteId));
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        const newFavRef = await addDoc(collection(db, 'users', uid, 'favorites'), {
          userId: uid,
          scriptureId: id
        });
        setIsFavorite(true);
        setFavoriteId(newFavRef.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveNote = async () => {
    if (!auth.currentUser || !id) return;
    setIsSavingNote(true);
    const uid = auth.currentUser.uid;

    try {
      if (noteId) {
        await updateDoc(doc(db, 'users', uid, 'notes', noteId), {
          content: note,
          updatedAt: new Date().toISOString()
        });
      } else {
        const newNoteRef = await addDoc(collection(db, 'users', uid, 'notes'), {
          userId: uid,
          scriptureId: id,
          content: note,
          updatedAt: new Date().toISOString()
        });
        setNoteId(newNoteRef.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingNote(false);
    }
  };

  const shareScripture = () => {
    if (!scripture) return;
    const shareText = `${scripture.reference}: "${scripture.text}"\n\nEstudando via App Domínio das Escrituras.`;
    if (navigator.share) {
      navigator.share({
        title: scripture.reference,
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Copiado para a área de transferência!');
    }
  };

  if (loading) return <div className="py-20 text-center text-stone-400">Carregando...</div>;
  if (!scripture) return <div className="py-20 text-center text-stone-600">Escritura não encontrada.</div>;

  const sections = [
    { title: 'Contexto Histórico', icon: Info, content: scripture.historicalContext, color: 'bg-amber-50 text-amber-900 border-amber-200' },
    { title: 'Ensinamento Doutrinário', icon: Lightbulb, content: scripture.doctrinalTeaching, color: 'bg-blue-50 text-blue-900 border-blue-200' },
    { title: 'Aplicação Missionária', icon: Globe, content: scripture.missionaryApplication, color: 'bg-green-50 text-green-900 border-green-200' },
    { title: 'Aplicação Pessoal', icon: UserIcon, content: scripture.personalApplication, color: 'bg-purple-50 text-purple-900 border-purple-200' },
  ];

  return (
    <div className="pb-24">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => navigate('/')}
          className="p-2 hover:bg-stone-200 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-2">
          <Link 
            to={`/games/${id}`}
            className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-full text-sm font-black hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 uppercase tracking-tighter"
          >
            <Gamepad2 size={20} />
            <span>Jogue para decorar</span>
          </Link>
          <button 
            onClick={shareScripture}
            className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-600"
          >
            <Share2 size={24} />
          </button>
          <button 
            onClick={toggleFavorite}
            className={cn(
              "p-2 rounded-full transition-all",
              isFavorite ? "bg-red-50 text-red-500 scale-110" : "hover:bg-stone-200 text-stone-400"
            )}
          >
            <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-stone-100 rounded-[3rem] overflow-hidden shadow-2xl mb-12 border-t-8 border-t-amber-900"
      >
        <div className="p-8 md:p-16">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tighter text-stone-900 mb-10">
              {scripture.reference}
            </h1>
            
            <div className="relative py-8">
              <span className="text-stone-100 font-serif text-[120px] absolute -top-16 -left-16 leading-none select-none">“</span>
              <p className="text-2xl md:text-4xl font-serif italic leading-relaxed text-stone-800 relative z-10 px-4">
                {scripture.text}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {sections.map((section, idx) => (
          <motion.div 
            key={section.title}
            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn("p-6 rounded-3xl border-2 shadow-sm flex flex-col gap-4", section.color)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <section.icon size={20} />
              </div>
              <h3 className="font-bold text-lg uppercase tracking-tight">{section.title}</h3>
            </div>
            <p className="leading-relaxed opacity-90">{section.content}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] p-8 border border-stone-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Edit3 className="text-stone-400" />
            <h3 className="text-xl font-bold text-stone-800">Notas e Destaques</h3>
          </div>
          <button 
            onClick={saveNote}
            disabled={isSavingNote}
            className="flex items-center gap-2 bg-stone-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-stone-700 transition-all disabled:opacity-50"
          >
            {isSavingNote ? 'Salvando...' : <><Save size={18} /> Salvar</>}
          </button>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Adicione suas impressões pessoais, metas de memorização ou reflexões..."
          className="w-full h-40 p-4 bg-stone-50 border border-stone-100 rounded-2xl focus:ring-2 focus:ring-stone-200 focus:outline-none transition-all resize-none shadow-inner"
        />
      </div>
    </div>
  );
};

export default ScriptureDetails;
