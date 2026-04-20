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
  const [phase, setPhase] = useState<'preview' | 'playing'>('preview');
  const [level, setLevel] = useState(1);
  const words = useMemo(() => scripture.text.split(/\s+/), [scripture.text]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Generate hidden indices iteratively based on level
  const hiddenIndices = useMemo(() => {
    const indices = Array.from({ length: words.length }, (_, i) => i);
    // Shuffle once with a seed based on scripture text for consistency or just random
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // Hide 20% more at each level
    const count = Math.floor((words.length * level) / 6);
    return new Set(indices.slice(0, count));
  }, [words.length, level]);

  const [userInputs, setUserInputs] = useState<Record<number, string>>({});

  const handleInputChange = (index: number, value: string) => {
    setUserInputs(prev => ({ ...prev, [index]: value }));
    setShowResult(false);
  };

  const checkResults = () => {
    const allCorrect = Array.from(hiddenIndices).every(i => {
      const cleanTarget = words[i].toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      const cleanInput = (userInputs[i] || '').trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      return cleanTarget === cleanInput;
    });
    setIsCorrect(allCorrect);
    setShowResult(true);
  };

  const nextLevel = () => {
    if (level < 6) {
      setLevel(prev => prev + 1);
      setUserInputs({});
      setShowResult(false);
    }
  };

  if (phase === 'preview') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-12 py-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-12 bg-white border border-stone-200 rounded-[3rem] shadow-xl max-w-2xl w-full"
        >
          <div className="text-[10px] uppercase font-black tracking-[0.2em] text-amber-500 mb-6">Memorize o Texto</div>
          <p className="text-3xl font-serif italic text-stone-800 leading-relaxed mb-10">
            "{scripture.text}"
          </p>
          <button
            onClick={() => setPhase('playing')}
            className="group relative bg-stone-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-amber-600 transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            Estou pronto!
            <div className="absolute -inset-1 bg-amber-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
          </button>
        </motion.div>
        <p className="text-stone-400 text-xs font-medium uppercase tracking-widest">Dica: Leia o texto em voz alta algumas vezes</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 text-center flex-1 flex flex-col pb-10">
      <div className="flex items-center justify-between px-4">
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-black text-amber-600 tracking-widest uppercase">Estágio</span>
          <span className="text-2xl font-black text-stone-900 leading-none">NÍVEL {level}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-stone-400 uppercase">Dificuldade</span>
          <div className="flex gap-1 mt-1">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className={cn("h-1.5 w-4 rounded-full", i <= level ? "bg-amber-500" : "bg-stone-100")} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-8 text-2xl p-8 bg-stone-50/50 rounded-[2.5rem] border border-stone-100 shadow-sm min-h-[300px] items-center">
        {words.map((word, i) => {
          if (!hiddenIndices.has(i)) {
            return (
              <span key={i} className="font-serif italic text-stone-800">
                {word}
              </span>
            );
          }

          const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
          const punctuation = word.slice(cleanWord.length);

          return (
            <div key={i} className="relative group">
              <input
                type="text"
                value={userInputs[i] || ''}
                onChange={(e) => handleInputChange(i, e.target.value)}
                placeholder="..."
                className={cn(
                  "bg-white border-b-2 border-amber-200 focus:border-stone-900 focus:outline-none px-2 py-1 font-serif italic text-stone-800 transition-all placeholder:text-stone-200 rounded-t-xl text-center shadow-sm",
                  showResult && (
                    (userInputs[i] || '').trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"") === cleanWord.toLowerCase()
                      ? "bg-green-50 border-green-500 text-green-700 font-bold"
                      : "bg-red-50 border-red-400 text-red-600"
                  )
                )}
                style={{ width: `${Math.max(cleanWord.length * 0.9 + 1.5, 4)}rem` }}
                autoComplete="off"
              />
              {punctuation && <span className="text-stone-400 ml-0.5">{punctuation}</span>}
            </div>
          );
        })}
      </div>

      <div className="max-w-xs mx-auto w-full space-y-4">
        {!isCorrect || !showResult ? (
          <button 
            onClick={checkResults}
            className="w-full bg-stone-900 text-white py-5 rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-md group flex items-center justify-center gap-2"
          >
            Verificar Acertos
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        ) : (
          level < 6 && (
            <button 
              onClick={nextLevel}
              className="w-full bg-amber-500 text-white py-5 rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-md transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Próximo Nível
              <Trophy size={18} />
            </button>
          )
        )}

        <AnimatePresence>
          {showResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2",
                isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )}
            >
              {isCorrect ? (
                <><CheckCircle2 size={18} /> Excelente! Você restaurou o texto corretamente.</>
              ) : (
                <><XCircle size={18} /> Algumas palavras ainda estão faltando ou incorretas.</>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
        {isCorrect && showResult && level === 6 ? "🏆 Sensacional! Você dominou o texto completamente!" : "Preencha as palavras que sumiram"}
      </div>
    </div>
  );
};

const FirstLetterGame = ({ scripture }: { scripture: Scripture }) => {
  const words = useMemo(() => scripture.text.split(/\s+/), [scripture.text]);
  const [userInputs, setUserInputs] = useState<string[]>(new Array(words.length).fill(''));
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...userInputs];
    newInputs[index] = value;
    setUserInputs(newInputs);
    setShowResult(false);
  };

  const checkResults = () => {
    const correct = words.every((word, i) => {
      const cleanTarget = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      const cleanInput = (word[0] + userInputs[i]).trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      return cleanTarget === cleanInput;
    });
    setIsCorrect(correct);
    setShowResult(true);
  };

  return (
    <div className="space-y-8 text-center flex-1 flex flex-col pb-10">
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-6 text-xl p-8 bg-stone-50/50 rounded-3xl border border-stone-100 shadow-sm min-h-[200px]">
        {words.map((word, i) => {
          const firstLetter = word[0];
          const restOfWord = word.slice(1);
          // Split rest of the word from punctuation
          const cleanRest = restOfWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
          const punctuation = restOfWord.slice(cleanRest.length);
          
          return (
            <div key={i} className="flex items-baseline">
              <span className="font-serif font-bold text-amber-600 text-2xl mr-0.5">{firstLetter}</span>
              <div className="relative">
                <input
                  type="text"
                  value={userInputs[i]}
                  onChange={(e) => handleInputChange(i, e.target.value)}
                  className={cn(
                    "bg-transparent border-b-2 border-stone-200 focus:border-stone-900 focus:outline-none px-1 py-0 font-serif italic text-stone-800 transition-all",
                    showResult && (
                      (word[0] + userInputs[i]).trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"") === word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
                        ? "border-green-500 text-green-700 font-bold"
                        : "border-red-400 text-red-600"
                    )
                  )}
                  style={{ width: `${Math.max(cleanRest.length * 0.7 + 0.8, 1.5)}rem` }}
                  autoComplete="off"
                />
                {punctuation && <span className="text-stone-400 ml-0.5">{punctuation}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="max-w-xs mx-auto w-full space-y-4">
        <button 
          onClick={checkResults}
          className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-md group flex items-center justify-center gap-2"
        >
          {showResult ? 'Verificar Novamente' : 'Verificar Acertos'}
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>

        <AnimatePresence>
          {showResult && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "p-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2",
                isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )}
            >
              {isCorrect ? (
                <><CheckCircle2 size={18} /> Perfeito! Você completou toda a escritura.</>
              ) : (
                <><XCircle size={18} /> Algumas palavras ainda não estão corretas.</>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
        Dica: Complete a palavra partindo da primeira letra destacada
      </div>
    </div>
  );
};

interface ScrambleBlock {
  id: number;
  text: string;
}

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
      let maxWordsIdx = -1;
      let maxWordsCount = 1;

      for (let i = 0; i < final.length; i++) {
        const wordCount = final[i].split(/\s+/).length;
        if (wordCount > maxWordsCount) {
          maxWordsCount = wordCount;
          maxWordsIdx = i;
        }
      }

      if (maxWordsIdx === -1) break;

      const segmentWords = final[maxWordsIdx].split(/\s+/);
      const mid = Math.ceil(segmentWords.length / 2);
      const part1 = segmentWords.slice(0, mid).join(' ');
      const part2 = segmentWords.slice(mid).join(' ');
      
      final.splice(maxWordsIdx, 1, part1, part2);
    }

    return final.filter(s => s.length > 0).map((text, id) => ({ id, text }));
  }, [scripture.text]);

  const [shuffled, setShuffled] = useState<ScrambleBlock[]>([]);
  const [currentOrder, setCurrentOrder] = useState<ScrambleBlock[]>([]);
  const [wrongId, setWrongId] = useState<number | null>(null);

  useEffect(() => {
    setShuffled([...blocks].sort(() => Math.random() - 0.5));
  }, [blocks]);

  const handleBlockClick = (block: ScrambleBlock) => {
    const nextIndex = currentOrder.length;
    if (blocks[nextIndex].text === block.text) {
      setCurrentOrder([...currentOrder, block]);
      setShuffled(shuffled.filter(s => s.id !== block.id));
    } else {
      setWrongId(block.id);
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
            key={b.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-amber-100 text-amber-900 px-4 py-2 rounded-xl text-lg font-serif"
          >
            {b.text}
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {shuffled.map((b) => (
          <motion.button
            key={b.id}
            animate={wrongId === b.id ? { x: [-5, 5, -5, 5, 0], backgroundColor: '#fee2e2' } : {}}
            onClick={() => handleBlockClick(b)}
            className="bg-stone-50 border border-stone-200 px-5 py-3 rounded-2xl text-stone-700 font-serif hover:bg-stone-100 transition-colors shadow-sm"
          >
            {b.text}
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
