import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Scripture } from '../types';
import { Search, ChevronRight, Book } from 'lucide-react';
import { motion } from 'motion/react';
import initialScriptures from '../initial_scriptures.json';

const Home: React.FC = () => {
  const [scriptures, setScriptures] = useState<Scripture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScriptures = async () => {
      try {
        const q = query(collection(db, 'scriptures'));
        const querySnapshot = await getDocs(q);
        const fetchedScriptures: Scripture[] = [];
        querySnapshot.forEach((doc) => {
          fetchedScriptures.push({ id: doc.id, ...doc.data() } as Scripture);
        });
        
        if (fetchedScriptures.length === 0) {
          setScriptures(initialScriptures as Scripture[]);
        } else {
          setScriptures(fetchedScriptures);
        }
      } catch (error) {
        console.error("Error fetching scriptures:", error);
        setScriptures(initialScriptures as Scripture[]);
      } finally {
        setLoading(false);
      }
    };

    fetchScriptures();
  }, []);

  const filteredScriptures = scriptures.filter(s => 
    s.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-12 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-black tracking-tighter text-stone-900 mb-4"
        >
          DOMÍNIO DAS ESCRITURAS
        </motion.h1>
        <p className="text-xl italic text-stone-600 font-serif">Velho Testamento</p>
      </header>

      <div className="relative mb-12">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar referência ou texto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-stone-200 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-stone-200 focus:outline-none transition-all placeholder:text-stone-400"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredScriptures.map((scripture, index) => (
          <motion.div
            key={scripture.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <div 
              onClick={() => navigate(`/scripture/${scripture.id}`)}
              className="group cursor-pointer block bg-white border border-stone-200/60 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300 relative overflow-hidden text-center"
            >
              <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Book size={60} />
              </div>
              
              <h2 className="text-lg md:text-xl font-serif font-bold text-stone-800 group-hover:text-amber-900 transition-colors">
                {scripture.reference}
              </h2>
              
              <div className="mt-4 flex flex-col gap-2">
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-stone-400 group-hover:text-amber-700 transition-colors">
                  VER COMPLETO
                </span>
                <Link 
                  to={`/games/${scripture.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 bg-amber-50 text-amber-700 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all transform hover:scale-105"
                >
                  Jogue para decorar
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredScriptures.length === 0 && (
        <div className="text-center py-20 text-stone-400">
          Nenhuma escritura encontrada para "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default Home;
