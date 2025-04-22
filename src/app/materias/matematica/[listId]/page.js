"use client";

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ExerciseWrapper from '../../../../components/ExerciseWrapper';
import { useExerciseData } from '../../../../utils/exerciseLoader';

export default function ExerciseListPage() {
  const params = useParams();
  const listId = params.listId;
  
  const { exerciseData, isLoading, error } = useExerciseData('matematica', listId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--primary)]"></div>
        <p className="mt-4 text-[var(--text-secondary)]">Carregando exercícios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center min-h-screen p-6">
        <div className="p-6 rounded-lg bg-red-100 text-red-800 max-w-4xl w-full">
          <h2 className="text-xl font-bold mb-2">Erro ao carregar exercícios</h2>
          <p>{error}</p>
          <Link href="/materias/matematica" className="mt-4 inline-block text-[var(--blue)] hover:underline">
            ← Voltar para a lista de exercícios
          </Link>
        </div>
      </div>
    );
  }

  if (!exerciseData) {
    return (
      <div className="flex flex-col items-center min-h-screen p-6">
        <div className="p-6 rounded-lg bg-[rgba(28,176,246,0.1)] max-w-4xl w-full">
          <h2 className="text-xl font-bold mb-2">Lista de exercícios não encontrada</h2>
          <p>A lista de exercícios que você procura não existe ou foi removida.</p>
          <Link href="/materias/matematica" className="mt-4 inline-block text-[var(--blue)] hover:underline">
            ← Voltar para a lista de exercícios
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = exerciseData.data ? new Date(exerciseData.data).toLocaleDateString('pt-BR') : '';

  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <motion.header 
        className="flex items-center justify-between w-full py-4 mb-8"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Link href="/materias/matematica" className="text-[var(--text-primary)] hover:underline">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-bold text-center text-[var(--text-primary)]">
          {exerciseData.title}
        </h1>
        <div className="w-20"></div> {/* Espaçador para centralizar o título */}
      </motion.header>

      <motion.main 
        className="w-full max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.div 
          className="mb-8 duolingo-card p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-xl font-bold mb-2">{exerciseData.nome}</h2>
          <p className="text-[var(--text-secondary)] mb-2">{exerciseData.description}</p>
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="bg-[rgba(88,204,2,0.1)] px-3 py-1 rounded-full">
              <span className="font-medium">{exerciseData.materia}</span>
            </div>
            <div className="bg-[rgba(28,176,246,0.1)] px-3 py-1 rounded-full">
              <span className="font-medium">{exerciseData.ano_letivo}</span>
            </div>
            <div className="bg-[rgba(255,200,0,0.1)] px-3 py-1 rounded-full">
              <span className="font-medium">Data: {formattedDate}</span>
            </div>
          </div>
        </motion.div>

        <ExerciseWrapper exercises={exerciseData.exercises} />
      </motion.main>
    </div>
  );
}