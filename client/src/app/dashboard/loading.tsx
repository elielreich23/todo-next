/**
 * Loading component for dashboard routes
 * Server Component - uses CSS modules for styling
 */
import styles from './loading.module.css';

export default function DashboardLoading() {
  return (
    <div className={styles.container}>
      <div>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    </div>
  );
}
