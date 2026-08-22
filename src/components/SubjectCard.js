"use client";

import Image from 'next/image';
import Link from 'next/link';
import { assetPath } from '../utils/assetPath';

export default function SubjectCard({ id, title, icon }) {
  return (
    <Link href={`/materias/${id}`} className="duolingo-subject-card">
      <Image
        src={assetPath(icon)}
        alt={`Ícone de ${title}`}
        width={64}
        height={64}
        className="duolingo-subject-card-icon"
      />
      <span className="duolingo-subject-card-title">{title}</span>
    </Link>
  );
}