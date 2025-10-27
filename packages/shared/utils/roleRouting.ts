import type { UserRole } from '../types';

export const ROLE_ROUTES: Record<UserRole, string> = {
  platform_admin: '/platform-admin',
  ent_admin: '/ent-admin',
  decider: '/decider',
  employee: '/employee',
  shop_admin: '/shop-admin',
  cashier: '/cashier',
  collaborator: '/collaborator',
  user: '/user',
};

export function getRoleRoute(role: UserRole): string {
  return ROLE_ROUTES[role] || '/';
}

export function isAuthorizedForRoute(userRole: UserRole, pathname: string): boolean {
  const roleRoute = getRoleRoute(userRole);
  return pathname.startsWith(roleRoute) || pathname === '/';
}

export async function fetchUserByAccountId(accountId: string) {
  try {
    const response = await fetch('/api/users/by-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching user:', error);
  }
  return null;
}
