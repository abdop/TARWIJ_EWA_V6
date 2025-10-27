import dynamic from 'next/dynamic';
import { useSelector } from 'react-redux';
import { RootState } from '../src/store';
import Link from 'next/link';
import styles from '../src/styles/Dashboard.module.css';

const HashConnectButton = dynamic(
  () => import('../src/components/HashConnectButton'),
  { ssr: false }
);

export default function Dashboard() {
  const { isConnected, accountId } = useSelector((state: RootState) => state.hashconnect);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <h2>TARWIJ EWA</h2>
        </div>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Home</Link>
          <HashConnectButton />
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Manage your wage advance requests</p>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>👤 Wallet Status</h3>
            </div>
            <div className={styles.cardBody}>
              {isConnected ? (
                <>
                  <div className={styles.statusRow}>
                    <span className={styles.statusLabel}>Connection:</span>
                    <span className={styles.statusConnected}>● Connected</span>
                  </div>
                  <div className={styles.statusRow}>
                    <span className={styles.statusLabel}>Account:</span>
                    <span className={styles.accountValue}>{accountId}</span>
                  </div>
                  <div className={styles.statusRow}>
                    <span className={styles.statusLabel}>Network:</span>
                    <span className={styles.networkValue}>Hedera Testnet</span>
                  </div>
                </>
              ) : (
                <div className={styles.notConnected}>
                  <p>🔌 Wallet not connected</p>
                  <p className={styles.hint}>Please connect your wallet to continue</p>
                </div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>📊 Quick Stats</h3>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.stat}>
                <span className={styles.statValue}>0</span>
                <span className={styles.statLabel}>Pending Requests</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>0</span>
                <span className={styles.statLabel}>Approved</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>0</span>
                <span className={styles.statLabel}>Completed</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>🔄 Recent Activity</h3>
            </div>
            <div className={styles.cardBody}>
              {isConnected ? (
                <div className={styles.emptyState}>
                  <p>No recent activity</p>
                  <p className={styles.hint}>Your transactions will appear here</p>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>Connect wallet to view activity</p>
                </div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>⚡ Quick Actions</h3>
            </div>
            <div className={styles.cardBody}>
              <button 
                className={styles.actionButton}
                disabled={!isConnected}
              >
                Request Wage Advance
              </button>
              <button 
                className={styles.actionButton}
                disabled={!isConnected}
              >
                View History
              </button>
              <button 
                className={styles.actionButton}
                disabled={!isConnected}
              >
                Check Balance
              </button>
            </div>
          </div>
        </div>

        {isConnected && (
          <div className={styles.infoBox}>
            <h4>✅ Wallet Connected Successfully!</h4>
            <p>You can now interact with the TARWIJ EWA platform using your Hedera account.</p>
            <p className={styles.accountDisplay}>Connected as: <strong>{accountId}</strong></p>
          </div>
        )}
      </main>
    </div>
  );
}
