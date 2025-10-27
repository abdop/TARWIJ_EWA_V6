import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { RootState } from '../src/store';
import Link from 'next/link';
import styles from '../src/styles/Home.module.css';

const HashConnectButton = dynamic(
  () => import('../src/components/HashConnectButton'),
  { ssr: false }
);

const ROLE_ROUTES: Record<string, string> = {
  platform_admin: '/platform-admin',
  ent_admin: '/ent-admin',
  decider: '/decider',
  employee: '/employee',
  shop_admin: '/shop-admin',
  cashier: '/cashier',
  collaborator: '/collaborator',
  user: '/user',
};

export default function Home() {
  const router = useRouter();
  const { isConnected, accountId, user, userRole } = useSelector((state: RootState) => state.hashconnect);

  // Redirect to role-specific dashboard if connected
  useEffect(() => {
    if (isConnected && userRole && ROLE_ROUTES[userRole]) {
      router.push(ROLE_ROUTES[userRole]);
    }
  }, [isConnected, userRole, router]);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          TARWIJ EWA Platform
        </h1>
        
        <p className={styles.description}>
          Employee Wage Advance on Hedera Network
        </p>

        <div className={styles.card}>
          <h2>🔐 Wallet Connection</h2>
          <p className={styles.subtitle}>Connect your Hedera wallet to access your dashboard</p>
          
          <div className={styles.buttonContainer}>
            <HashConnectButton />
          </div>

          {isConnected && user && (
            <div className={styles.statusCard}>
              <div className={styles.statusItem}>
                <span className={styles.label}>Status:</span>
                <span className={styles.valueConnected}>✅ Connected</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.label}>Account ID:</span>
                <span className={styles.valueAccount}>{accountId}</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.label}>Name:</span>
                <span className={styles.valueAccount}>{user.name}</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.label}>Role:</span>
                <span className={styles.valueAccount}>{user.role}</span>
              </div>
            </div>
          )}

          {!isConnected && (
            <div className={styles.infoCard}>
              <p>👆 Click the button above to connect your HashPack wallet</p>
              <p className={styles.hint}>Make sure you have HashPack extension installed</p>
            </div>
          )}
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>🏦 Multi-Sig Approval</h3>
            <p>Secure wage advances with decider approvals</p>
          </div>
          <div className={styles.feature}>
            <h3>⏰ Scheduled Transactions</h3>
            <p>Automated token minting with time delays</p>
          </div>
          <div className={styles.feature}>
            <h3>🔒 Enterprise Tokens</h3>
            <p>Custom tokens for each enterprise</p>
          </div>
        </div>
      </main>
    </div>
  );
}
