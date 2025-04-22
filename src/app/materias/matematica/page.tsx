import Link from 'next/link';
import styles from './page.module.css';

export default function MatematicaHome() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Matemática</h1>
      <ul className={styles.list}>
        <li className={styles.item}>
          <Link href="/materias/matematica/20250404" className={styles.link}>
            Quiz de Matemática (04/04/2025)
          </Link>
        </li>
      </ul>
    </div>
  );
}