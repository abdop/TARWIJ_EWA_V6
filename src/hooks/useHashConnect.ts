import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setLoading, setConnected, setDisconnected, setError } from '../store/hashconnectSlice';
import { 
  getHashConnectInstance, 
  getInitPromise, 
  getConnectedAccountIds,
  initializeHashConnect 
} from '../services/hashconnect';

const useHashConnect = () => {
  const dispatch = useDispatch();
  const hashconnectState = useSelector((state: RootState) => state.hashconnect);
  const { isConnected, accountId, isLoading, error, user, userRole } = hashconnectState;

  useEffect(() => {
    const setupHashConnect = async () => {
      try {
        // Only run on client side
        if (typeof window === 'undefined') return;

        const instance = initializeHashConnect();
        if (!instance) return;

        const initPromise = getInitPromise();
        if (initPromise) {
          await initPromise;
        }

        // Set up event listeners
        instance.pairingEvent.on(async (pairingData: any) => {
          console.log("Wallet paired:", pairingData);
          const accountIds = getConnectedAccountIds();
          if (accountIds && accountIds.length > 0) {
            const accountId = accountIds[0].toString();
            
            // Fetch user data
            try {
              const response = await fetch('/api/users/by-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId }),
              });
              
              if (response.ok) {
                const user = await response.json();
                dispatch(setConnected({ accountId, user }));
              } else {
                dispatch(setConnected({ accountId }));
              }
            } catch (error) {
              console.error('Error fetching user:', error);
              dispatch(setConnected({ accountId }));
            }
          }
        });

        instance.disconnectionEvent.on(() => {
          console.log("Wallet disconnected");
          dispatch(setDisconnected());
        });

        instance.connectionStatusChangeEvent.on((status: any) => {
          console.log("Connection status changed:", status);
        });

        // Check if already connected
        const accountIds = getConnectedAccountIds();
        if (accountIds && accountIds.length > 0) {
          const accountId = accountIds[0].toString();
          
          // Fetch user data
          try {
            const response = await fetch('/api/users/by-account', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accountId }),
            });
            
            if (response.ok) {
              const user = await response.json();
              dispatch(setConnected({ accountId, user }));
            } else {
              dispatch(setConnected({ accountId }));
            }
          } catch (error) {
            console.error('Error fetching user:', error);
            dispatch(setConnected({ accountId }));
          }
        }

      } catch (error) {
        console.error('HashConnect setup failed:', error);
        dispatch(setError(error instanceof Error ? error.message : 'Setup failed'));
      }
    };

    setupHashConnect();
  }, [dispatch]);

  const connect = async () => {
    dispatch(setLoading(true));
    try {
      if (typeof window === 'undefined') {
        throw new Error('Cannot connect on server side');
      }

      const instance = getHashConnectInstance();
      await instance.openPairingModal();
    } catch (error) {
      console.error('Connection failed:', error);
      dispatch(setError(error instanceof Error ? error.message : 'Connection failed'));
    }
  };

  const disconnect = () => {
    try {
      const instance = getHashConnectInstance();
      instance.disconnect();
      dispatch(setDisconnected());
    } catch (error) {
      console.error('Disconnect failed:', error);
      dispatch(setDisconnected());
    }
  };

  return {
    isConnected,
    accountId,
    isLoading,
    error,
    user,
    userRole,
    connect,
    disconnect,
  };
};

export default useHashConnect;
