import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Must use firebaseConfig.firestoreDatabaseId as documented in Firebase skill
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (err: any) {
    if (err?.message?.includes('the client is offline')) {
      console.warn('Firestore offline cache active.');
    }
    return false;
  }
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      // Save or update user profile document in Firestore
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(
        userRef,
        {
          userId: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || 'Healthcare Officer',
          role: 'DISTRICT_COORDINATOR',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    return result.user;
  } catch (err) {
    console.error('Google Sign-in error:', err);
    throw err;
  }
}

export async function logoutUser() {
  await fbSignOut(auth);
}

export async function saveTransferAudit(audit: {
  transferId: string;
  approvedBy: string;
  userEmail: string;
  status: 'APPROVED' | 'REJECTED';
  sourceFacilityId: string;
  targetFacilityId: string;
  medicineId: string;
  quantity: number;
  notes?: string;
}) {
  const auditRef = doc(db, 'transfer_audits', `${audit.transferId}_${Date.now()}`);
  try {
    await setDoc(auditRef, {
      ...audit,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'transfer_audits');
  }
}
