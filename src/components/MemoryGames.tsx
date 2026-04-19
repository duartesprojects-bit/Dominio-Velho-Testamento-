import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Scripture } from '../types';
import { 
  ChevronLeft, 
  RotateCcw, 
  Gamepad2, 
  Trophy, 
  AlertCircle,
  EyeOff,
  Type,
  Puzzle,
  Mic2,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import initialScriptures from '../initial_scriptures.json';

type GameMode = 'hidden' | 'firstletter' | 'scramble' | 'dictation' | null;

const MemoryGames: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scripture, setScripture] = useState<Scripture | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<GameMode>(null);

  useEffect(() => {
    const fetchScripture = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'scriptures', id));
        if (docSnap.exists()) {
          setScripture({ id: docSnap.id, ...docSnap.data() } as Scripture);
        } else {
          // Fallback to local data
          const fallback = (initialScriptures as Scripture[]).find(s => s.id === id);
          if (fallback) setScripture(fallback);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchScripture();
  }, [id]);

  if (loading) return <div className="py-20 text-center italic text-stone-400">Preparando arena de estudos...</div>;
  if (!scripture) return <div className="py-20 text-center">Escritura não encontrada.</div>;

  return (
    <div className="space-y-8">
      <button 
        onClick={() => mode ? setMode(null) : navigate(-1)}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ChevronLeft size={20} />
        {mode ? 'Voltar aos Jogos' : 'Voltar à Escritura'}
      </button>

      {!mode ? (
        <section className="space-y-8">
          <header className="text-center md:text-left">
            <h2 className="text-4xl font-black text-stone-900 tracking-tighter uppercase mb-4">Jogos de Memorização</h2>
            <p className="text-stone-500 italic max-w-2xl font-serif">Escolha um modo de treino para gravar {scripture.reference} em seu coração.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GameCard 
              title="Texto que Desaparece" 
              desc="O texto some aos poucos enquanto você tenta lê-lo e escrevê-lo. Desafie sua memória visual."
              icon={<EyeOff size={32} />}
              onClick={() => setMode('hidden')}
              color="amber"
            />
            <GameCard 
              title="Primeira Letra (Iniciais)" 
              desc="Veja apenas a primeira letra de cada palavra. O guia perfeito para destravar sua mente."
              icon={<Type size={32} />}
              onClick={() => setMode('firstletter')}
              color="stone"
            />
            <GameCard 
              title="Quebra-Cabeça de Blocos" 
              desc="Organize as frases em ordem cronológica. Domine o fluxo rítmico da escritura."
              icon={<Puzzle size={32} />}
              onClick={() => setMode('scramble')}
              color="amber"
            />
            <GameCard 
              title="Ditado Interativo" 
              desc="Teste sua precisão palavra por palavra. Um erro pode custar uma vida!"
              icon={<Gamepad2 size={32} />}
              onClick={() => setMode('dictation')}
              color="stone"
            />
          </div>
        </section>
      ) : (
        <div className="bg-white border border-stone-200 rounded-[3rem] p-8 md:p-12 shadow-sm min-h-[500px] flex flex-col items-center">
          <h3 className="text-2xl font-black text-stone-900 mb-8 uppercase tracking-tighter">
            {mode === 'hidden' && 'Texto que Desaparece'}
            {mode === 'firstletter' && 'Iniciais'}
            {mode === 'scramble' && 'Quebra-Cabeça'}
            {mode === 'dictation' && 'Ditado Interativo'}
          </h3>
          
          <div className="w-full max-w-3xl flex-1 flex flex-col">
            {mode === 'hidden' && <HiddenGame scripture={scripture} />}
            {mode === 'firstletter' && <FirstLetterGame scripture={scripture} />}
            {mode === 'scramble' && <ScrambleGame scripture={scripture} />}
            {mode === 'dictation' && <DictationGame scripture={scripture} />}
          </div>
        </div>
      )}
    </div>
  );
};

const GameCard = ({ title, desc, icon, onClick, color }: any) => (
  <motion.button
    whileHover={{ y: -5 }}
    onClick={onClick}
    className={cn(
      "p-8 rounded-[2.5rem] border text-left transition-all relative overflow-hidden group",
      color === 'amber' ? "bg-amber-50 border-amber-100 hover:border-amber-300" : "bg-stone-50 border-stone-100 hover:border-stone-300"
    )}
  >
    <div className={cn(
      "mb-6 p-4 rounded-2xl w-fit",
      color === 'amber' ? "bg-white text-amber-800" : "bg-white text-stone-800"
    )}>
      {icon}
    </div>
    <h4 className="text-xl font-bold text-stone-900 mb-2">{title}</h4>
    <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
  </motion.button>
);

// --- GAME COMPONENTS ---

const HiddenGame = ({ scripture }: { scripture: Scripture }) => {
  const [level, setLevel] = useState(0);
  const words = useMemo(() => scripture.text.split(' '), [scripture.text]);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<boolean | null>(null);

  const hiddenIndices = useMemo(() => {
    const totalToHide = Math.floor((words.length * level) / 5);
    const indices = Array.from({ length: words.length }, (_, i) => i);
    // Fisher-Yates shuffle to pick random indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return new Set(indices.slice(0, totalToHide));
  }, [words.length, level]);

  const checkResult = () => {
    const cleanOrig = scripture.text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ");
    const cleanUser = userInput.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ");
    setFeedback(cleanOrig === cleanUser);
  };

  return (
    <div className="space-y-10 text-center flex-1 flex flex-col">
      <div className="flex flex-wrap justify-center gap-2 text-2xl font-serif italic text-stone-800 leading-relaxed min-h-[150px] items-center">
        {words.map((word, i) => (
          <span key={i} className={cn(
            "transition-all duration-500 rounded px-1",
            hiddenIndices.has(i) ? "bg-stone-100 text-transparent select-none blur-sm" : ""
          )}>
            {word}
          </span>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase tracking-widest px-2">
          <span>Nível {level + 1} / 6</span>
          <span>{level * 20}% Oculto</span>
        </div>
        <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-amber-500"
            initial={{ width: 0 }}
            animate={{ width: `${(level / 5) * 100}%` }}
          />
        </div>
      </div>

      <textarea
        value={userInput}
        onChange={(e) => {
          setUserInput(e.target.value);
          setFeedback(null);
        }}
        placeholder="Escreva a escritura aqui..."
        className="w-full p-8 bg-stone-50 border border-stone-200 rounded-3xl h-40 resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 font-serif text-lg italic"
      />

      <div className="flex gap-4">
        <button 
          onClick={checkResult}
          className="flex-1 bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all"
        >
          Verificar
        </button>
        {feedback === true && level < 5 && (
          <button 
            onClick={() => {
              setLevel(l => l + 1);
              setUserInput('');
              setFeedback(null);
            }}
            className="flex-1 bg-amber-500 text-white py-4 rounded-2xl font-bold hover:bg-amber-600 transition-all motion-safe:animate-bounce"
          >
            Avançar Nível
          </button>
        )}
      </div>

      <AnimatePresence>
        {feedback !== null && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2",
              feedback ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            )}
          >
            {feedback ? (
              <><CheckCircle2 size={18} /> Excelente! Você acertou.</>
            ) : (
              <><XCircle size={18} /> Quase lá! Tente revisar o texto visível acima.</>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FirstLetterGame = ({ scripture }: { scripture: Scripture }) => {
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  const initialText = useMemo(() => {
    return scripture.text.split(' ').map(w => w[0] + '.'.repeat(w.length - 1)).join(' ');
  }, [scripture.text]);

  const check = (val: string) => {
    const cleanOrig = scripture.text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ");
    const cleanUser = val.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ");
    setIsCorrect(cleanOrig === cleanUser);
  };

  return (
    <div className="space-y-10 text-center flex-1 flex flex-col">
      <div className="text-3xl font-mono text-stone-300 break-words leading-loose tracking-widest p-8 bg-stone-50 rounded-3xl min-h-[150px] flex items-center justify-center">
        {initialText}
      </div>

      <textarea
        value={userInput}
        onChange={(e) => {
          setUserInput(e.target.value);
          check(e.target.value);
        }}
        placeholder="Transforme as letras em palavras..."
        className="w-full p-8 bg-white border border-stone-200 rounded-3xl h-48 resize-none focus:outline-none focus:ring-2 focus:ring-stone-400 font-serif text-lg italic shadow-inner"
      />

      <AnimatePresence>
        {isCorrect && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-green-100 text-green-800 p-8 rounded-3xl flex flex-col items-center gap-4"
          >
            <Trophy size={48} className="text-amber-500" />
            <h4 className="text-2xl font-black uppercase tracking-tighter">Memorizado!</h4>
            <p className="text-sm italic">Você conseguiu restaurar todo o texto apenas pelas iniciais.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ScrambleGame = ({ scripture }: { scripture: Scripture }) => {
  const blocks = useMemo(() => {
    // Phase 1: Split by punctuation
    const puncItems = scripture.text.split(/([,.;:!?]\s+)/).filter(Boolean);
    const initialSegments: string[] = [];
    for (let i = 0; i < puncItems.length; i++) {
      if (puncItems[i].match(/[,.;:!?]\s+/)) {
        if (initialSegments.length > 0) initialSegments[initialSegments.length - 1] += puncItems[i].trim();
      } else {
        initialSegments.push(puncItems[i].trim());
      }
    }

    // Phase 2: If we have fewer than 5 segments, split the largest ones until we hit 5 (or can't split anymore)
    let final = [...initialSegments];
    while (final.length < 5) {
      // Find the index of the segment with the most words (that hasn't been split to single words)
      let maxWordsIdx = -1;
      let maxWordsCount = 1;

      for (let i = 0; i < final.length; i++) {
        const wordCount = final[i].split(/\s+/).length;
        if (wordCount > maxWordsCount) {
          maxWordsCount = wordCount;
          maxWordsIdx = i;
        }
      }

      if (maxWordsIdx === -1) break; // Cannot split further

      // Split the segment roughly in half
      const segmentWords = final[maxWordsIdx].split(/\s+/);
      const mid = Math.ceil(segmentWords.length / 2);
      const part1 = segmentWords.slice(0, mid).join(' ');
      const part2 = segmentWords.slice(mid).join(' ');
      
      final.splice(maxWordsIdx, 1, part1, part2);
    }

    return final.filter(s => s.length > 0);
  }, [scripture.text]);

  const [shuffled, setShuffled] = useState<string[]>([]);
  const [currentOrder, setCurrentOrder] = useState<string[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);

  useEffect(() => {
    setShuffled([...blocks].sort(() => Math.random() - 0.5));
  }, [blocks]);

  const handleBlockClick = (block: string) => {
    const nextIndex = currentOrder.length;
    if (blocks[nextIndex] === block) {
      setCurrentOrder([...currentOrder, block]);
      setShuffled(shuffled.filter(s => s !== block));
    } else {
      setWrongId(block);
      setTimeout(() => setWrongId(null), 500);
    }
  };

  const reset = () => {
    setCurrentOrder([]);
    setShuffled([...blocks].sort(() => Math.random() - 0.5));
  };

  return (
    <div className="space-y-12">
      <div className="min-h-[200px] border-2 border-dashed border-stone-100 rounded-[2.5rem] p-8 flex flex-wrap gap-3 content-start relative">
        {currentOrder.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-stone-300 italic">
            Coloque as frases em ordem aqui...
          </div>
        )}
        {currentOrder.map((b, i) => (
          <motion.div 
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-amber-100 text-amber-900 px-4 py-2 rounded-xl text-lg font-serif"
          >
            {b}
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {shuffled.map((b, i) => (
          <motion.button
            key={i}
            animate={wrongId === b ? { x: [-5, 5, -5, 5, 0], backgroundColor: '#fee2e2' } : {}}
            onClick={() => handleBlockClick(b)}
            className="bg-stone-50 border border-stone-200 px-5 py-3 rounded-2xl text-stone-700 font-serif hover:bg-stone-100 transition-colors shadow-sm"
          >
            {b}
          </motion.button>
        ))}
      </div>

      {currentOrder.length === blocks.length && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="p-4 bg-green-50 text-green-700 rounded-2xl font-bold">
            Ordenação Perfeita!
          </div>
          <button onClick={reset} className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-800 transition-colors">
            <RotateCcw size={16} /> Reiniciar
          </button>
        </motion.div>
      )}
    </div>
  );
};

const DictationGame = ({ scripture }: { scripture: Scripture }) => {
  const allWords = useMemo(() => scripture.text.split(/\s+/), [scripture.text]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [userInput, setUserInput] = useState('');
  const [blocking, setBlocking] = useState(false);
  const [errorWord, setErrorWord] = useState<string | null>(null);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (blocking) return;
    setUserInput(e.target.value);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (blocking || !userInput.trim()) return;

    const currentTarget = allWords[currentWordIdx];
    const cleanTarget = currentTarget.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const cleanInput = userInput.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");

    if (cleanTarget === cleanInput) {
      setCurrentWordIdx(prev => prev + 1);
      setUserInput('');
    } else {
      // Error
      setLives(prev => prev - 1);
      setBlocking(true);
      setErrorWord(currentTarget);
      
      setTimeout(() => {
        setBlocking(false);
        setErrorWord(null);
        setUserInput('');
      }, 2000);
    }
  };

  const reset = () => {
    setCurrentWordIdx(0);
    setLives(3);
    setUserInput('');
    setBlocking(false);
  };

  if (lives <= 0) {
    return (
      <div className="text-center space-y-8 py-10">
        <XCircle size={80} className="mx-auto text-red-500" />
        <h3 className="text-3xl font-black uppercase text-red-700">Fim de Jogo!</h3>
        <p className="text-stone-500 italic">Você errou 3 vezes. Que tal revisar a escritura e tentar novamente?</p>
        <button onClick={reset} className="bg-stone-900 text-white px-10 py-4 rounded-2xl font-bold">Tentar de Novo</button>
      </div>
    );
  }

  if (currentWordIdx === allWords.length) {
    return (
      <div className="text-center space-y-8 py-10">
        <Trophy size={80} className="mx-auto text-amber-500 animate-bounce" />
        <h3 className="text-3xl font-black uppercase text-green-700">Vitória!</h3>
        <p className="text-stone-500 italic">Você digitou toda a escritura sem erros fatais.</p>
        <button onClick={reset} className="bg-stone-900 text-white px-10 py-4 rounded-2xl font-bold">Jogar Novamente</button>
      </div>
    );
  }

  return (
    <div className="space-y-12 h-full flex flex-col justify-center">
      <div className="flex justify-center gap-3">
        {[...Array(3)].map((_, i) => (
          <Heart key={i} size={24} fill={i < lives ? "#ef4444" : "transparent"} className={i < lives ? "text-red-500" : "text-stone-200"} />
        ))}
      </div>

      <div className="min-h-[100px] flex flex-wrap justify-center gap-3 text-2xl font-serif">
        {allWords.slice(0, currentWordIdx).map((w, i) => (
          <span key={i} className="text-stone-300">{w}</span>
        ))}
        <motion.span 
          animate={blocking ? { scale: 1.2, color: '#ef4444' } : { scale: 1 }}
          className="text-stone-900 font-bold border-b-2 border-stone-200 px-2"
        >
          {userInput || (blocking ? errorWord : '...')}
        </motion.span>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xs mx-auto w-full space-y-4">
        <input 
          autoFocus
          value={userInput}
          onChange={handleInput}
          disabled={blocking}
          autoComplete="off"
          className={cn(
            "w-full p-4 text-center text-xl font-bold bg-stone-50 border-2 rounded-2xl transition-all",
            blocking ? "border-red-500 bg-red-50" : "border-stone-200 focus:border-stone-900 focus:outline-none focus:ring-0 shadow-sm"
          )}
          placeholder="Digite a palavra..."
        />
        <button
          type="submit"
          disabled={blocking || !userInput.trim()}
          className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Enviar <ArrowRight size={18} />
        </button>
        {blocking && (
          <p className="text-center text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">
            Ops! A palavra correta era: {errorWord}
          </p>
        )}
      </form>

      <div className="text-xs text-stone-400 text-center italic">
        Atenção: A acentuação e pontuação importam no ditado!
      </div>
    </div>
  );
};

const Heart = ({ className, fill, size }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} height={size} 
    viewBox="0 0 24 24" 
    fill={fill} 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

export default MemoryGames;
