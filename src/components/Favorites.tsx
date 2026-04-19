import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Scripture, Favorite } from '../types';
import { Heart, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<Scripture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!auth.currentUser) return;
      try {
        const uid = auth.currentUser.uid;
        const favSnap = await getDocs(collection(db, 'users', uid, 'favorites'));
        const scriptureIds: string[] = [];
        favSnap.forEach(doc => scriptureIds.push(doc.data().scriptureId));
        
        const fetchedScriptures: Scripture[] = [];
        for (const sId of scriptureIds) {
          const sDoc = await getDoc(doc(db, 'scriptures', sId));
          if (sDoc.exists()) {
            fetchedScriptures.push({ id: sDoc.id, ...sDoc.data() } as Scripture);
          }
        }
        setFavorites(fetchedScriptures);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  if (loading) return <div className="py-20 text-center animate-pulse text-stone-300">Buscando seus favoritos...</div>;

  return (
    <div>
      <header className="mb-12">
        <h2 className="text-4xl font-black text-stone-900 tracking-tighter uppercase mb-2">Escrituras Favoritas</h2>
        <p className="text-stone-500 italic">As passagens que mais tocam seu coração.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {favorites.map((scripture, idx) => (
          <motion.div
            key={scripture.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link 
              to={`/scripture/${scripture.id}`}
              className="group block bg-white border border-stone-200 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-stone-800">{scripture.reference}</h3>
                <Heart size={18} fill="#ef4444" className="text-red-500" />
              </div>
              <p className="text-sm text-stone-600 line-clamp-2 italic">"{scripture.text}"</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {favorites.length === 0 && (
        <div className="text-center py-20">
          <Heart size={48} className="mx-auto text-stone-200 mb-4" />
          <p className="text-stone-400">Você ainda não favoritou nenhuma escritura.</p>
          <Link to="/" className="text-stone-800 font-bold underline mt-4 inline-block">Ver todas as escrituras</Link>
        </div>
      )}
    </div>
  );
};

export default Favorites;
