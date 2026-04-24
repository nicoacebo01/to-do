import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { IdeaRequest, Status, Comment, AppUser, StatusChange } from '../types';

const REQUESTS_COL = 'idea_requests';

export function subscribeToRequests(callback: (requests: IdeaRequest[]) => void): () => void {
  const q = query(collection(db, REQUESTS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as IdeaRequest));
    callback(data);
  });
}

export async function createRequest(
  data: Omit<IdeaRequest, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>
): Promise<string> {
  const now = Timestamp.now();
  const initialHistory: StatusChange[] = [
    {
      from: null,
      to: Status.IDEA,
      changedAt: now,
      changedBy: data.submittedBy.email,
      changedByName: data.submittedBy.name,
    },
  ];
  const ref = await addDoc(collection(db, REQUESTS_COL), {
    ...data,
    statusHistory: initialHistory,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRequestStatus(
  requestId: string,
  newStatus: Status,
  changedBy: string,
  changedByName: string,
  currentHistory: StatusChange[],
  currentStatus: Status,
  ambassadorNotes?: string
): Promise<void> {
  const change: StatusChange = {
    from: currentStatus,
    to: newStatus,
    changedAt: Timestamp.now(),
    changedBy,
    changedByName,
  };
  const updates: Record<string, unknown> = {
    status: newStatus,
    statusHistory: [...currentHistory, change],
    updatedAt: serverTimestamp(),
  };
  if (newStatus === Status.DONE) {
    updates.resolvedAt = serverTimestamp();
  }
  if (ambassadorNotes !== undefined) {
    updates.ambassadorNotes = ambassadorNotes;
  }
  await updateDoc(doc(db, REQUESTS_COL, requestId), updates);
}

export async function updateAmbassadorNotes(requestId: string, notes: string): Promise<void> {
  await updateDoc(doc(db, REQUESTS_COL, requestId), {
    ambassadorNotes: notes,
    updatedAt: serverTimestamp(),
  });
}

export async function updateRequestPriority(requestId: string, priority: string): Promise<void> {
  await updateDoc(doc(db, REQUESTS_COL, requestId), {
    priority,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(db, REQUESTS_COL, requestId));
}

// Comments
export function subscribeToComments(
  requestId: string,
  callback: (comments: Comment[]) => void
): () => void {
  const q = query(
    collection(db, REQUESTS_COL, requestId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
    callback(data);
  });
}

export async function addCommentToRequest(
  requestId: string,
  comment: Omit<Comment, 'id' | 'createdAt'>
): Promise<void> {
  await addDoc(collection(db, REQUESTS_COL, requestId, 'comments'), {
    ...comment,
    createdAt: serverTimestamp(),
  });
}

// Users
export function subscribeToUsers(callback: (users: AppUser[]) => void): () => void {
  return onSnapshot(collection(db, 'idea_users'), (snap) => {
    const data = snap.docs.map((d) => ({ ...d.data() } as AppUser));
    callback(data);
  });
}

export async function addUser(user: Omit<AppUser, 'addedAt'>): Promise<void> {
  await addDoc(collection(db, 'idea_users'), {
    ...user,
    addedAt: serverTimestamp(),
  });
}

export async function removeUser(email: string): Promise<void> {
  const snap = await getDocs(collection(db, 'idea_users'));
  const docToDelete = snap.docs.find((d) => d.data().email === email);
  if (docToDelete) {
    await deleteDoc(doc(db, 'idea_users', docToDelete.id));
  }
}
