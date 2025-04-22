import styles from './page.module.css';

export default function PortuguesHome() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Português</h1>
      <p className={styles.noExercises}>
        Nenhum exercício disponível ainda. Em breve!
      </p>
    </div>
  );
}