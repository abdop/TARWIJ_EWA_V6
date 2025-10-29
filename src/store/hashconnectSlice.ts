import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  category: string;
  entrepriseId?: string;
  hedera_id: string;
}

interface HashConnectState {
  isConnected: boolean | null;
  accountId: string | null;
  isLoading: boolean;
  error: string | null;
  user: User | null;
  userRole: string | null;
}

const initialState: HashConnectState = {
  isConnected: null,
  accountId: null,
  isLoading: false,
  error: null,
  user: null,
  userRole: null,
};

const hashconnectSlice = createSlice({
  name: 'hashconnect',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
        state.isConnected = null;
      }
    },
    setConnected: (state, action: PayloadAction<{ accountId: string; user?: User }>) => {
      state.isConnected = true;
      state.accountId = action.payload.accountId;
      state.user = action.payload.user || null;
      state.userRole = action.payload.user?.category || null;
      state.isLoading = false;
      state.error = null;
    },
    setDisconnected: (state) => {
      state.isConnected = false;
      state.accountId = null;
      state.user = null;
      state.userRole = null;
      state.isLoading = false;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setLoading, setConnected, setDisconnected, setError } = hashconnectSlice.actions;
export default hashconnectSlice.reducer;
