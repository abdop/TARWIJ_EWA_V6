import React from 'react';
import useHashConnect from '../hooks/useHashConnect';
import styles from './HashConnectButton.module.css';

const HashConnectButton: React.FC = () => {
  const { isConnected, accountId, isLoading, error, connect, disconnect } = useHashConnect();

  const formatAccountId = (id: string) => {
    if (!id) return '';
    if (id.length <= 10) return id;
    return `${id.slice(0, 6)}...${id.slice(-4)}`;
  };

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      {!isConnected ? (
        <button
          className={styles.connectButton}
          onClick={connect}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className={styles.spinner}></span>
              Connecting...
            </>
          ) : (
            '🔗 Connect Wallet'
          )}
        </button>
      ) : (
        <div className={styles.connectedContainer}>
          <div className={styles.accountInfo}>
            <span className={styles.connectedDot}>●</span>
            <span className={styles.accountId}>
              {accountId || formatAccountId(accountId || '')}
            </span>
          </div>
          <button
            className={styles.disconnectButton}
            onClick={disconnect}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default HashConnectButton;
