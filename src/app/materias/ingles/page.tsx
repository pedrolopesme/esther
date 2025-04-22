import Link from 'next/link';
import styles from './page.module.css';

export default function InglesHome() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Inglês</h1>
      <ul className={styles.list}>
        <li className={styles.item}>
          <Link href="/materias/ingles/yle/starters" className={styles.link}>
            YLE Starters
          </Link>
        </li>
      </ul>
    </div>
  );
}