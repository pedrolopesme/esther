"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  // Lista de matérias disponíveis
  const subjects = [
    {
      id: "matematica",
      title: "Matemática",
      icon: "/globe.svg", // Placeholder, você pode substituir por ícones específicos
      color: "rgba(88, 204, 2, 0.1)"
    },
    {
      id: "portugues",
      title: "Português",
      icon: "/file.svg",
      color: "rgba(255, 200, 0, 0.1)"
    },
    {
      id: "ingles",
      title: "Inglês",
      icon: "/window.svg",
      color: "rgba(28, 176, 246, 0.1)"
    },
    {
      id: "ciencias",
      title: "Ciências",
      icon: "/vercel.svg",
      color: "rgba(255, 82, 193, 0.1)"
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
        <h1 className="text-5xl font-bold text-center bg-gradient-to-r from-[var(--primary)] via-[var(--blue)] to-[var(--purple)] text-transparent bg-clip-text">
          Aprenda brincando!
        </h1>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-2xl mx-auto mb-12 text-center"
      >
        <p className="text-xl text-[var(--text-secondary)]">
          Pratique seus exercícios escolares de forma divertida e interativa com a nossa plataforma inspirada no Duolingo!
        </p>
      </motion.div>

      <div className="flex flex-col items-center w-full max-w-4xl">
        <motion.h2 
          className="text-2xl font-bold mb-8 text-[var(--text-primary)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Escolha uma matéria
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
                  src={subject.icon}
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
    </div>
  );
}