export type UserRole = 'ADMIN' | 'SCRUM_MASTER' | 'EMPLOYEE';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
}
