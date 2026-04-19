import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserNote, Scripture } from '../types';
import { FileText, Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<{ note: UserNote, scripture: Scripture | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotesWithScriptures = async () => {
      if (!auth.currentUser) return;
      try {
        const uid = auth.currentUser.uid;
        const noteSnap = await getDocs(collection(db, 'users', uid, 'notes'));
        
        const fetched: { note: UserNote, scripture: Scripture | null }[] = [];
        for (const nDoc of noteSnap.docs) {
          const noteData = { id: nDoc.id, ...nDoc.data() } as UserNote;
          const sDoc = await getDoc(doc(db, 'scriptures', noteData.scriptureId));
          fetched.push({
            note: noteData,
            scripture: sDoc.exists() ? { id: sDoc.id, ...sDoc.data() } as Scripture : null
          });
        }
        setNotes(fetched.sort((a, b) => new Date(b.note.updatedAt).getTime() - new Date(a.note.updatedAt).getTime()));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotesWithScriptures();
  }, []);

  if (loading) return <div className="py-20 text-center text-stone-300 italic">Carregando suas reflexões...</div>;

  return (
    <div>
      <header className="mb-12">
        <h2 className="text-4xl font-black text-stone-900 tracking-tighter uppercase mb-2">Minhas Notas</h2>
        <p className="text-stone-500 italic">Um registro do seu aprendizado e inspiração.</p>
      </header>

      <div className="space-y-6">
        {notes.map((item, idx) => (
          <motion.div
            key={item.note.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="bg-amber-50/50 border border-amber-100 p-10 rounded-[3rem] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <FileText size={100} className="text-amber-900" />
              </div>
              <div className="flex items-center justify-between mb-6 border-b border-amber-200/50 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-xl text-amber-800 shadow-sm">
                    <FileText size={20} />
                  </div>
                  <h3 className="font-serif font-bold text-2xl text-stone-800">{item.scripture?.reference || 'Escritura'}</h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] font-sans">
                  <Calendar size={14} />
                  {new Date(item.note.updatedAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
              
              <p className="text-stone-700 leading-relaxed mb-8 text-xl font-serif italic relative z-10">
                {item.note.content}
              </p>

              <Link 
                to={`/scripture/${item.note.scriptureId}`}
                className="inline-flex items-center gap-2 text-xs font-bold text-amber-800 hover:text-amber-900 uppercase tracking-widest transition-colors relative z-10"
              >
                Voltar à Escritura <ChevronRight size={16} />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center py-20">
          <FileText size={48} className="mx-auto text-stone-200 mb-4" />
          <p className="text-stone-400">Você ainda não criou nenhuma nota.</p>
          <Link to="/" className="text-stone-800 font-bold underline mt-4 inline-block">Começar a estudar</Link>
        </div>
      )}
    </div>
  );
};

export default Notes;
