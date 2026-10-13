// ============================================================
// FILE: frontend/components/Sidebar.js
// Left sidebar navigation
// ============================================================

import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/',          icon: '🏠', label: 'Dashboard' },
  { href: '/students',  icon: '👩‍🎓', label: 'Students' },
  { href: '/badges',    icon: '⭐', label: 'Award Badges' },
  { href: '/approvals', icon: '✉️', label: 'Approvals' },
  { href: '/analytics', icon: '📊', label: 'Analytics' },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>🌉</span>
        <div>
          <span className={styles.logoText}>LearnBridge</span>
          <p className={styles.logoSub}>Teacher Portal</p>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${router.pathname === item.href ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.teacherInfo}>
          <div className={styles.avatar}>TA</div>
          <div>
            <div className={styles.teacherName}>Teacher Alex</div>
            <div className={styles.teacherRole}>Class Advisor</div>
          </div>
        </div>
        <p className={styles.version}>v1.0 · LearnBridge</p>
      </div>
    </aside>
  );
}
