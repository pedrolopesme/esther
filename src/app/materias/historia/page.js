"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '../../../components/Card';
import { motion } from 'framer-motion';
import { getAvailableExerciseLists } from '../../../utils/exerciseLoader';

export default function HistoriaPage() {
  const [exerciseLists, setExerciseLists] = useState([]);
  const [filterYear, setFilterYear] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function loadExerciseLists() {
      try {
        setIsLoading(true);
        const lists = await getAvailableExerciseLists('historia');
        setExerciseLists(lists);
        setError(null);
      } catch (err) {
        console.error("Erro ao carregar listas de exercícios:", err);
        setError("Não foi possível carregar as listas de exercícios. Por favor, tente novamente.");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadExerciseLists();
  }, []);
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  const uniqueYears = Array.from(new Set(exerciseLists.map(l => l.ano_letivo).filter(Boolean)));
  const filteredLists = exerciseLists.filter((l) => {
    const matchesYear = filterYear ? l.ano_letivo === filterYear : true;
    const matchesDate = filterDate ? (new Date(l.date).toISOString().slice(0,10) === filterDate) : true;
    return matchesYear && matchesDate;
  });

  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <motion.header 
        className="flex items-center justify-between w-full py-4 mb-8"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Link href="/" className="text-[var(--text-primary)] hover:underline">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-[var(--primary)] to-[var(--blue)] text-transparent bg-clip-text">
          História
        </h1>
        <div className="w-20"></div> {/* Espaçador para centralizar o título */}
      </motion.header>

      <motion.main 
        className="w-full max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.h2 
          className="text-2xl font-bold mb-6 text-[var(--text-primary)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Listas de Exercícios
        </motion.h2>

        {/* Filtros rápidos */}
        <div className="duolingo-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Ano da lista</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="border rounded-lg px-3 py-2 text-[var(--text-primary)]"
              >
                <option value="">Todos</option>
                {uniqueYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-1">Data do exercício</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border rounded-lg px-3 py-2 text-[var(--text-primary)]"
              />
            </div>
            <button
              onClick={() => { setFilterYear(''); setFilterDate(''); }}
              className="duolingo-button secondary"
            >
              Limpar filtros
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-100 text-red-800 mb-4">
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && exerciseLists.length === 0 && (
          <div className="p-4 rounded-lg bg-[rgba(28,176,246,0.1)] mb-4">
            <p>Nenhuma lista de exercícios disponível no momento.</p>
          </div>
        )}

        {!isLoading && !error && filteredLists.length === 0 && exerciseLists.length > 0 && (
          <div className="p-4 rounded-lg bg-[rgba(255,200,0,0.1)] mb-4">
            <p>Nenhum item corresponde aos filtros selecionados.</p>
          </div>
        )}

        <motion.div 
          className="space-y-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {filteredLists.map((list, index) => (
            <motion.div key={list.id} variants={item} custom={index}>
              <Link 
                href={`/materias/historia/${list.id}`}
                className="block"
              >
                <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-[var(--primary)] hover:scale-[1.02] transform transition-transform">
                  <h3 className="text-xl font-bold mb-2">{list.title}</h3>
                  <p className="text-[var(--text-secondary)] mb-2">{list.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {list.ano_letivo && (
                      <span className="inline-block bg-[rgba(88,204,2,0.1)] px-2 py-1 rounded-full text-xs">
                        {list.ano_letivo}
                      </span>
                    )}
                    <span className="inline-block bg-[rgba(255,200,0,0.1)] px-2 py-1 rounded-full text-xs">
                      Data: {new Date(list.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.main>
    </div>
  );
}
