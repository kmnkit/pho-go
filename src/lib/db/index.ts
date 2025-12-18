import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

export const db = drizzle(sql, { schema });

export { schema };
export type { 
  User, 
  NewUser, 
  Account, 
  Session, 
  UserProgress, 
  NewUserProgress,
  StudySession,
  NewStudySession 
} from './schema';