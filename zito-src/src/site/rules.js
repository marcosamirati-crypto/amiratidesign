// As MESMAS regras declaradas na página publicada (capabilities.db.rules).
export const RULES = [
  { path: '', read: 'view', write: 'owner' },
  { path: 'sessions', read: 'view', write: 'owner' },
  { path: 'pc', read: 'owner', write: 'owner' },
  { path: 'pc/{self}', read: 'view', write: 'owner' },
  { path: 'req', read: 'owner', write: 'owner' },
  { path: 'req/{self}', read: 'view', write: 'interact' },
  { path: 'gm', read: 'owner', write: 'owner' },
];
