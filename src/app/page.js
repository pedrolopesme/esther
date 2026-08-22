"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { assetPath } from '../utils/assetPath';
import { motion } from "framer-motion";

export default function Home() {
  const [latestLists, setLatestLists] = useState([]);
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);
  const [latestError, setLatestError] = useState(null);

  useEffect(() => {
    async function fetchLatest() {
      try {
        setIsLoadingLatest(true);
        const res = await fetch("/data/latest.json");
        if (!res.ok) throw new Error(`Falha ao buscar últimas listas: ${res.status}`);
        const data = await res.json();
        setLatestLists(data);
        setLatestError(null);
      } catch (e) {
        console.error(e);
        setLatestError("Não foi possível carregar as últimas listas.");
      } finally {
        setIsLoadingLatest(false);
      }
    }
    fetchLatest();
  }, []);
  // Lista de matérias disponíveis
  const subjects = [
    {
      id: "matematica",
      title: "🔢 Matemática",
      icon: "/globe.svg",
      color: "rgba(255, 105, 180, 0.1)"
    },
    {
      id: "portugues", 
      title: "📚 Português",
      icon: "/file.svg",
      color: "rgba(255, 20, 147, 0.1)"
    },
    {
      id: "ingles",
      title: "🇺🇸 Inglês",
      icon: "/window.svg",
      color: "rgba(218, 112, 214, 0.1)"
    },
    {
      id: "geografia",
      title: "🌍 Geografia",
      icon: "/vercel.svg",
      color: "rgba(255, 130, 193, 0.1)"
    },
    {
      id: "historia",
      title: "📜 História",
      icon: "/globe.svg",
      color: "rgba(255, 165, 0, 0.1)"
    },
    {
      id: "ciencias",
      title: "🔬 Ciências",
      icon: "/globe.svg",
      color: "rgba(144, 238, 144, 0.15)"
    },
  ];

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

  return (
    <div className="flex flex-col items-center py-12 px-6">
      <motion.div
        className="mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl font-bold text-center bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--purple)] text-transparent bg-clip-text">
          ✨ Vamos estudar juntas! ✨
        </h1>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-2xl mx-auto mb-12 text-center"
      >
        <p className="text-xl text-[var(--text-secondary)]">
          🌟 Hora de se preparar para as provas! Aqui você vai aprender de um jeito super divertido e colorido! 🌈
        </p>
      </motion.div>

      <div className="flex flex-col items-center w-full max-w-4xl">
        <motion.h2 
          className="text-2xl font-bold mb-8 text-[var(--text-primary)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          💖 Escolha sua matéria favorita 💖
        </motion.h2>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {subjects.map((subject, index) => (
            <motion.div key={subject.id} variants={item} custom={index}>
              <Link 
                href={`/materias/${subject.id}`} 
                className="duolingo-subject-card"
                style={{ backgroundColor: subject.color }}
              >
                <Image
                  src={assetPath(subject.icon)}
                  alt={`Ícone de ${subject.title}`}
                  width={64}
                  height={64}
                  className="duolingo-subject-icon"
                />
                <h3 className="duolingo-subject-title">{subject.title}</h3>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Últimas listas de exercícios */}
      <motion.div
        className="w-full max-w-4xl mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">📋 Últimas listas de exercícios</h2>

        {isLoadingLatest && (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
          </div>
        )}

        {latestError && (
          <div className="p-4 rounded-lg bg-red-100 text-red-800">
            {latestError}
          </div>
        )}

        {!isLoadingLatest && !latestError && (
          <div className="space-y-3">
            {latestLists.map((item) => (
              <Link key={`${item.subject}-${item.id}`} href={`/materias/${item.subject}/${item.id}`} className="block">
                <div className="duolingo-card p-4 hover:shadow-md transition-shadow border-l-4 border-[var(--blue)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{item.title}</h3>
                      <div className="flex flex-wrap gap-2 mt-1 text-sm text-[var(--text-secondary)]">
                        <span className="inline-block bg-[rgba(88,204,2,0.1)] px-2 py-0.5 rounded-full">{item.materia}</span>
                        <span className="inline-block bg-[rgba(255,200,0,0.1)] px-2 py-0.5 rounded-full">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                        <span className="inline-block bg-[rgba(28,176,246,0.1)] px-2 py-0.5 rounded-full">{item.questionCount} questões</span>
                      </div>
                    </div>
                    <span className="text-[var(--blue)]">Ver →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
