import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { RegistrationRecord, BibleVerse, ScheduledDispatch, SentMessageLog, AppUser } from '../types';
import { INITIAL_RECORDS, INITIAL_VERSES, INITIAL_SCHEDULES } from '../data/initialData';
import { INITIAL_USERS } from './authStorage';
import {
  isSupabaseConfigured,
  fetchSupabaseRecords,
  upsertSupabaseRecord,
  deleteSupabaseRecord,
  fetchSupabaseVerses,
  upsertSupabaseVerse,
  deleteSupabaseVerse,
  fetchSupabaseSchedules,
  upsertSupabaseSchedule,
  deleteSupabaseSchedule,
  fetchSupabaseLogs,
  upsertSupabaseLog,
  fetchSupabaseUsers,
  upsertSupabaseUser,
  subscribeToSupabaseTable,
} from '../supabase';

// Firestore collection names
export const COLLECTIONS = {
  RECORDS: 'records',
  VERSES: 'verses',
  SCHEDULES: 'schedules',
  LOGS: 'logs',
  USERS: 'users',
  SETTINGS: 'settings',
};

// --- REALTIME SYNC LISTENERS ---

export function subscribeToRecords(
  onUpdate: (records: RegistrationRecord[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (isSupabaseConfigured()) {
    // Initial fetch from Supabase
    fetchSupabaseRecords().then((supaRecords) => {
      if (supaRecords && supaRecords.length > 0) {
        onUpdate(supaRecords);
      } else if (supaRecords && supaRecords.length === 0) {
        // First time initialization in Supabase: seed initial records
        INITIAL_RECORDS.forEach((r) => upsertSupabaseRecord(r));
        onUpdate(INITIAL_RECORDS);
      }
    });

    // Real-time Postgres changes subscription
    const unsub = subscribeToSupabaseTable('records', async () => {
      const fresh = await fetchSupabaseRecords();
      if (fresh) onUpdate(fresh);
    });
    return unsub;
  }

  const colRef = collection(db, COLLECTIONS.RECORDS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        const hasSeeded = localStorage.getItem('adleiria_records_seeded');
        if (!hasSeeded) {
          seedInitialRecords();
          localStorage.setItem('adleiria_records_seeded', 'true');
          onUpdate(INITIAL_RECORDS);
        } else {
          onUpdate([]);
        }
      } else {
        localStorage.setItem('adleiria_records_seeded', 'true');
        const demoIds = ['rec-1', 'rec-2', 'rec-3', 'rec-4'];
        const records = snapshot.docs
          .map((docSnap) => docSnap.data() as RegistrationRecord)
          .filter((r) => {
            if (demoIds.includes(r.id)) {
              deleteRecordFromCloud(r.id).catch(() => {});
              return false;
            }
            return true;
          });
        // Sort descending by date/createdAt
        records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onUpdate(records);
      }
    },
    (err) => {
      console.warn('Firestore records subscription notice:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeToVerses(
  onUpdate: (verses: BibleVerse[]) => void
): () => void {
  if (isSupabaseConfigured()) {
    fetchSupabaseVerses().then((supaVerses) => {
      if (supaVerses && supaVerses.length > 0) {
        onUpdate(supaVerses);
      } else if (supaVerses && supaVerses.length === 0) {
        INITIAL_VERSES.forEach((v) => upsertSupabaseVerse(v));
        onUpdate(INITIAL_VERSES);
      }
    });

    const unsub = subscribeToSupabaseTable('verses', async () => {
      const fresh = await fetchSupabaseVerses();
      if (fresh) onUpdate(fresh);
    });
    return unsub;
  }

  const colRef = collection(db, COLLECTIONS.VERSES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        seedInitialVerses();
        onUpdate(INITIAL_VERSES);
      } else {
        const verses = snapshot.docs.map((docSnap) => docSnap.data() as BibleVerse);
        onUpdate(verses);
      }
    },
    (err) => {
      console.warn('Firestore verses subscription notice:', err);
    }
  );
}

export function subscribeToSchedules(
  onUpdate: (schedules: ScheduledDispatch[]) => void
): () => void {
  if (isSupabaseConfigured()) {
    fetchSupabaseSchedules().then((supaSchedules) => {
      if (supaSchedules && supaSchedules.length > 0) {
        onUpdate(supaSchedules);
      } else if (supaSchedules && supaSchedules.length === 0) {
        INITIAL_SCHEDULES.forEach((s) => upsertSupabaseSchedule(s));
        onUpdate(INITIAL_SCHEDULES);
      }
    });

    const unsub = subscribeToSupabaseTable('schedules', async () => {
      const fresh = await fetchSupabaseSchedules();
      if (fresh) onUpdate(fresh);
    });
    return unsub;
  }

  const colRef = collection(db, COLLECTIONS.SCHEDULES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        seedInitialSchedules();
        onUpdate(INITIAL_SCHEDULES);
      } else {
        const schedules = snapshot.docs.map((docSnap) => docSnap.data() as ScheduledDispatch);
        schedules.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onUpdate(schedules);
      }
    },
    (err) => {
      console.warn('Firestore schedules subscription notice:', err);
    }
  );
}

export function subscribeToLogs(
  onUpdate: (logs: SentMessageLog[]) => void
): () => void {
  if (isSupabaseConfigured()) {
    fetchSupabaseLogs().then((supaLogs) => {
      if (supaLogs) {
        onUpdate(supaLogs);
      }
    });

    const unsub = subscribeToSupabaseTable('logs', async () => {
      const fresh = await fetchSupabaseLogs();
      if (fresh) onUpdate(fresh);
    });
    return unsub;
  }

  const colRef = collection(db, COLLECTIONS.LOGS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const logs = snapshot.docs.map((docSnap) => docSnap.data() as SentMessageLog);
      logs.sort((a, b) => (b.dataEnvio || '').localeCompare(a.dataEnvio || ''));
      onUpdate(logs);
    },
    (err) => {
      console.warn('Firestore logs subscription notice:', err);
    }
  );
}

export function subscribeToUsers(
  onUpdate: (users: AppUser[]) => void
): () => void {
  if (isSupabaseConfigured()) {
    fetchSupabaseUsers().then((supaUsers) => {
      if (supaUsers && supaUsers.length > 0) {
        onUpdate(supaUsers);
      } else if (supaUsers && supaUsers.length === 0) {
        INITIAL_USERS.forEach((u) => upsertSupabaseUser(u));
        onUpdate(INITIAL_USERS);
      }
    });

    const unsub = subscribeToSupabaseTable('users', async () => {
      const fresh = await fetchSupabaseUsers();
      if (fresh) onUpdate(fresh);
    });
    return unsub;
  }

  const colRef = collection(db, COLLECTIONS.USERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        seedInitialUsers();
        onUpdate(INITIAL_USERS);
      } else {
        const users = snapshot.docs.map((docSnap) => docSnap.data() as AppUser);
        onUpdate(users);
      }
    },
    (err) => {
      console.warn('Firestore users subscription notice:', err);
    }
  );
}

// Helper to remove undefined values
function removeUndefined(obj: any): any {
  if (obj === undefined || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  if (typeof obj === 'object') {
    const newObj: any = {};
    Object.keys(obj).forEach((key) => {
      const val = obj[key];
      if (val !== undefined) {
        newObj[key] = removeUndefined(val);
      }
    });
    return newObj;
  }
  return obj;
}

// --- ASYNC CLOUD CRUD ACTIONS ---

export async function syncRecordToCloud(record: RegistrationRecord): Promise<void> {
  if (isSupabaseConfigured()) {
    await upsertSupabaseRecord(record);
  }
  try {
    const docRef = doc(db, COLLECTIONS.RECORDS, record.id);
    const sanitizedRecord = removeUndefined(record);
    await setDoc(docRef, sanitizedRecord, { merge: true });
  } catch (error) {
    console.error('Error saving record to Firestore:', error);
  }
}

export async function deleteRecordFromCloud(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await deleteSupabaseRecord(id);
  }
  try {
    const docRef = doc(db, COLLECTIONS.RECORDS, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting record from Firestore:', error);
  }
}

export async function syncVerseToCloud(verse: BibleVerse): Promise<void> {
  if (isSupabaseConfigured()) {
    await upsertSupabaseVerse(verse);
  }
  try {
    const docRef = doc(db, COLLECTIONS.VERSES, verse.id);
    const sanitizedVerse = removeUndefined(verse);
    await setDoc(docRef, sanitizedVerse, { merge: true });
  } catch (error) {
    console.error('Error saving verse to Firestore:', error);
  }
}

export async function deleteVerseFromCloud(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await deleteSupabaseVerse(id);
  }
  try {
    const docRef = doc(db, COLLECTIONS.VERSES, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting verse from Firestore:', error);
  }
}

export async function syncScheduleToCloud(schedule: ScheduledDispatch): Promise<void> {
  if (isSupabaseConfigured()) {
    await upsertSupabaseSchedule(schedule);
  }
  try {
    const docRef = doc(db, COLLECTIONS.SCHEDULES, schedule.id);
    const sanitizedSchedule = removeUndefined(schedule);
    await setDoc(docRef, sanitizedSchedule, { merge: true });
  } catch (error) {
    console.error('Error saving schedule to Firestore:', error);
  }
}

export async function deleteScheduleFromCloud(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await deleteSupabaseSchedule(id);
  }
  try {
    const docRef = doc(db, COLLECTIONS.SCHEDULES, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting schedule from Firestore:', error);
  }
}

export async function clearAllSchedulesFromCloud(): Promise<void> {
  try {
    const colRef = collection(db, COLLECTIONS.SCHEDULES);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (error) {
    console.error('Error clearing schedules from Firestore:', error);
  }
}

export async function syncLogToCloud(log: SentMessageLog): Promise<void> {
  if (isSupabaseConfigured()) {
    await upsertSupabaseLog(log);
  }
  try {
    const docRef = doc(db, COLLECTIONS.LOGS, log.id);
    const sanitizedLog = removeUndefined(log);
    await setDoc(docRef, sanitizedLog, { merge: true });
  } catch (error) {
    console.error('Error saving log to Firestore:', error);
  }
}

export async function clearAllLogsFromCloud(): Promise<void> {
  try {
    const colRef = collection(db, COLLECTIONS.LOGS);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (error) {
    console.error('Error clearing logs from Firestore:', error);
  }
}

export async function syncUserToCloud(user: AppUser): Promise<void> {
  if (isSupabaseConfigured()) {
    await upsertSupabaseUser(user);
  }
  try {
    const docRef = doc(db, COLLECTIONS.USERS, user.id);
    const sanitizedUser = removeUndefined(user);
    await setDoc(docRef, sanitizedUser, { merge: true });
  } catch (error) {
    console.error('Error saving user to Firestore:', error);
  }
}

export async function deleteUserFromCloud(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting user from Firestore:', error);
  }
}

// --- DEFAULT PASTORAL MESSAGE SYNC ---
export async function syncDefaultMessageToCloud(message: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'default_message');
    await setDoc(docRef, { message, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.warn('Error saving default message to Firestore:', error);
  }
}

export function subscribeToDefaultMessage(onUpdate: (message: string) => void): () => void {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'default_message');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists() && typeof docSnap.data().message === 'string') {
        onUpdate(docSnap.data().message);
      }
    },
    (err) => {
      console.warn('Default message subscription notice:', err);
    }
  );
}

// --- GATEWAY CONFIG (WHATSAPP & EMAIL DIRECT API) SYNC ---
export async function syncGatewayConfigToCloud(config: Record<string, any>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'gateway_config');
    const sanitized = removeUndefined(config);
    await setDoc(docRef, { ...sanitized, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.warn('Error saving gateway config to Firestore:', error);
  }
}

export function subscribeToGatewayConfig(onUpdate: (config: Record<string, any>) => void): () => void {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'gateway_config');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data) {
          onUpdate(data);
        }
      }
    },
    (err) => {
      console.warn('Gateway config subscription notice:', err);
    }
  );
}

// --- SEEDERS FOR INITIAL DATA ---

async function seedInitialRecords() {
  try {
    const batch = writeBatch(db);
    INITIAL_RECORDS.forEach((rec) => {
      const docRef = doc(db, COLLECTIONS.RECORDS, rec.id);
      batch.set(docRef, rec);
    });
    await batch.commit();
  } catch (e) {
    console.warn('Initial records seed skipped/handled:', e);
  }
}

async function seedInitialVerses() {
  try {
    const batch = writeBatch(db);
    INITIAL_VERSES.forEach((v) => {
      const docRef = doc(db, COLLECTIONS.VERSES, v.id);
      batch.set(docRef, v);
    });
    await batch.commit();
  } catch (e) {
    console.warn('Initial verses seed skipped/handled:', e);
  }
}

async function seedInitialSchedules() {
  try {
    const batch = writeBatch(db);
    INITIAL_SCHEDULES.forEach((s) => {
      const docRef = doc(db, COLLECTIONS.SCHEDULES, s.id);
      batch.set(docRef, s);
    });
    await batch.commit();
  } catch (e) {
    console.warn('Initial schedules seed skipped/handled:', e);
  }
}

async function seedInitialUsers() {
  try {
    const batch = writeBatch(db);
    INITIAL_USERS.forEach((u) => {
      const docRef = doc(db, COLLECTIONS.USERS, u.id);
      batch.set(docRef, u);
    });
    await batch.commit();
  } catch (e) {
    console.warn('Initial users seed skipped/handled:', e);
  }
}
