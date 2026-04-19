import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Scripture } from '../types';
import { Link } from 'react-router-dom';
import { Gamepad2, Search, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import initialScriptures from '../initial_scriptures.json';

const GameSelection: React.FC = () => {
  const [scriptures, setScriptures] = useState<Scripture[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScriptures = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'scriptures'));
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Scripture));
        
        if (fetched.length === 0) {
          setScriptures(initialScriptures as Scripture[]);
        } else {
          setScriptures(fetched);
        }
      } catch (error) {
        console.error(error);
        setScriptures(initialScriptures as Scripture[]);
      } finally {
        setLoading(false);
      }
    };
    fetchScriptures();
  }, []);

  const filtered = scriptures.filter(s => 
    s.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-4xl font-black text-stone-900 tracking-tighter uppercase mb-4">Central de Jogos</h2>
        <p className="text-stone-500 italic font-serif">Escolha uma escritura para começar o seu treinamento de memorização.</p>
      </header>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-500 transition-colors" size={24} />
        <input 
          type="text"
          placeholder="Buscar escritura para jogar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-stone-200 rounded-[2rem] py-6 pl-16 pr-8 focus:outline-none focus:ring-4 focus:ring-amber-50/50 focus:border-amber-200 transition-all font-serif italic text-lg"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center italic text-stone-400">Carregando desafios...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link 
                to={`/games/${s.id}`}
                className="block group bg-white border border-stone-100 rounded-[2.5rem] p-8 hover:border-amber-300 transition-all hover:shadow-xl hover:shadow-amber-900/5"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-amber-100 text-amber-900 p-3 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Gamepad2 size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 group-hover:text-amber-400 transition-colors">Praticar</span>
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-2 truncate group-hover:text-amber-900">{s.reference}</h3>
                <p className="text-stone-400 text-sm italic font-serif line-clamp-2 mb-6">{s.text}</p>
                <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-widest pt-4 border-t border-stone-50 group-hover:border-amber-50 transition-colors">
                  Iniciar Treino <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameSelection;
