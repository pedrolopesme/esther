"use client";

import Image from 'next/image';
import Link from 'next/link';

export default function SubjectCard({ id, title, icon }) {
  return (
    <Link href={`/materias/${id}`} className="duolingo-subject-card">
      <Image
        src={icon}
        alt={`Ícone de ${title}`}
        width={64}
        height={64}
        className="duolingo-subject-icon"
      />
      <h3 className="duolingo-subject-title">{title}</h3>
    </Link>
  );
}