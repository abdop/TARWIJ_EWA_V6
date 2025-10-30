export type UserRole =
  | 'platform_admin'
  | 'ent_admin'
  | 'decider'
  | 'employee'
  | 'shop_admin'
  | 'cashier'
  | 'collaborator'
  | 'user';

export type UserCategory = UserRole;

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  category: UserRole;
  entrepriseId?: string;
  shopId?: string;
  hedera_id: string;
}

export interface HashConnectState {
  isConnected: boolean;
  accountId: string | null;
  isLoading: boolean;
  error: string | null;
  userRole?: UserRole;
  user?: User;
}
