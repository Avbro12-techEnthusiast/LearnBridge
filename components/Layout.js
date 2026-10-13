// ============================================================
// FILE: frontend/components/Layout.js
// Page layout with sidebar + main content area
// ============================================================

import Sidebar from './Sidebar';
import styles from './Layout.module.css';

export default function Layout({ children, title }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        {title && (
          <header className={styles.header}>
            <h1 className="page-title">{title}</h1>
          </header>
        )}
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
