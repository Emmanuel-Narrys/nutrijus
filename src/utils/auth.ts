// Utilitaires simples d'authentification admin
export function setAdminToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nutrijus_admin_token', token);
  }
}

export function getAdminToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nutrijus_admin_token');
}

export function removeAdminToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('nutrijus_admin_token');
  }
}

export function isAdminAuthenticated() {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('nutrijus_admin_token');
}
