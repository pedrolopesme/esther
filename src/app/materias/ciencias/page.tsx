import styles from './page.module.css';

export default function CienciasHome() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Ciências</h1>
      <p className={styles.noExercises}>
        Nenhum exercício disponível ainda. Em breve!
      </p>
    </div>
  );
}