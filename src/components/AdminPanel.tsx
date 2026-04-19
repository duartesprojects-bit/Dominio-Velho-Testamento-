import React, { useState, useEffect } from 'react';
import { collection, doc, getDocs, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Scripture } from '../types';
import { 
  Plus, 
  Trash2, 
  Database, 
  Save, 
  AlertCircle,
  CheckCircle2,
  List
} from 'lucide-react';
import { motion } from 'motion/react';
import initialScriptures from '../initial_scriptures.json';

const AdminPanel: React.FC = () => {
  const [scriptures, setScriptures] = useState<Scripture[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newSc, setNewSc] = useState<Partial<Scripture>>({
    reference: '',
    text: '',
    historicalContext: '',
    doctrinalTeaching: '',
    missionaryApplication: '',
    personalApplication: ''
  });

  useEffect(() => {
    fetchScriptures();
  }, []);

  const fetchScriptures = async () => {
    const q = collection(db, 'scriptures');
    const snap = await getDocs(q);
    const fetched: Scripture[] = [];
    snap.forEach(doc => fetched.push({ id: doc.id, ...doc.data() } as Scripture));
    setScriptures(fetched);
  };

  const handleSeed = async () => {
    if (!window.confirm('Isso irá adicionar as 25 escrituras do PDF ao banco de dados. Continuar?')) return;
    setIsSeeding(true);
    try {
      for (const sc of initialScriptures) {
        await setDoc(doc(db, 'scriptures', sc.id), sc);
      }
      fetchScriptures();
      alert('Banco de dados populado com sucesso (25 escrituras)!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSc.reference || !newSc.text) return;
    setIsSaving(true);
    try {
      const id = newSc.reference.toLowerCase().replace(/ /g, '-').replace(/:/g, '-');
      await setDoc(doc(db, 'scriptures', id), { ...newSc, id });
      setNewSc({
        reference: '',
        text: '',
        historicalContext: '',
        doctrinalTeaching: '',
        missionaryApplication: '',
        personalApplication: ''
      });
      fetchScriptures();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta escritura?')) return;
    try {
      await deleteDoc(doc(db, 'scriptures', id));
      fetchScriptures();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tighter uppercase mb-2">Painel Admin</h2>
          <p className="text-stone-500 italic">Gerenciamento de conteúdo do aplicativo.</p>
        </div>
        <button 
          onClick={handleSeed}
          disabled={isSeeding}
          className="flex items-center gap-2 bg-amber-100 text-amber-800 px-6 py-3 rounded-2xl text-sm font-bold hover:bg-amber-200 transition-all disabled:opacity-50"
        >
          <Database size={20} />
          {isSeeding ? 'Sincronizando...' : 'Popular Iniciais'}
        </button>
      </header>

      <section className="bg-white border border-stone-200 rounded-[2.5rem] p-8 shadow-sm">
        <h3 className="text-xl font-bold text-stone-800 mb-8 flex items-center gap-3">
          <Plus className="text-stone-400" /> Adicionar Nova Escritura
        </h3>
        
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-1">Referência</label>
              <input 
                value={newSc.reference}
                onChange={e => setNewSc({...newSc, reference: e.target.value})}
                placeholder="Ex: Êxodo 20:3-17"
                className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-stone-200"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-1">Texto Principal</label>
              <input 
                value={newSc.text}
                onChange={e => setNewSc({...newSc, text: e.target.value})}
                placeholder="O texto sagrado..."
                className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-stone-200"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-1">Contexto Histórico</label>
            <textarea 
              value={newSc.historicalContext}
              onChange={e => setNewSc({...newSc, historicalContext: e.target.value})}
              className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-stone-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-1">Ensinamento Doutrinário</label>
            <textarea 
              value={newSc.doctrinalTeaching}
              onChange={e => setNewSc({...newSc, doctrinalTeaching: e.target.value})}
              className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-stone-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-1">Aplicação Missionária</label>
              <textarea 
                value={newSc.missionaryApplication}
                onChange={e => setNewSc({...newSc, missionaryApplication: e.target.value})}
                className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-stone-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-1">Aplicação Pessoal</label>
              <textarea 
                value={newSc.personalApplication}
                onChange={e => setNewSc({...newSc, personalApplication: e.target.value})}
                className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-stone-200"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSaving}
            className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {isSaving ? 'Salvando...' : 'Salvar Escritura'}
          </button>
        </form>
      </section>

      <section>
        <h3 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-3">
          <List className="text-stone-400" /> Escrituras Cadastradas ({scriptures.length})
        </h3>
        
        <div className="bg-white border border-stone-200 rounded-[2.5rem] overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Referência</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Texto</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {scriptures.map(s => (
                <tr key={s.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-stone-800">{s.reference}</td>
                  <td className="px-6 py-4 text-stone-500 max-w-[300px] truncate">{s.text}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(s.id)}
                      className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {scriptures.length === 0 && (
            <div className="p-12 text-center text-stone-400 flex flex-col items-center gap-4">
              <AlertCircle size={40} className="text-stone-200" />
              Nenhuma escritura cadastrada no banco de dados. Use o botão "Popular Iniciais" no topo.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;
