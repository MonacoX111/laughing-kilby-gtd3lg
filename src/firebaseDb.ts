import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

// 🔥 Отримати всю колекцію
export async function loadCollection<T>(name: string): Promise<T[]> {
  const snapshot = await getDocs(collection(db, name));

  return snapshot.docs.map((docItem) => ({
    id: Number(docItem.id),
    ...docItem.data(),
  })) as T[];
}

// 🔥 realtime підписка (ВАЖЛИВО)
export function subscribeCollection<T>(
  name: string,
  callback: (data: T[]) => void
) {
  return onSnapshot(collection(db, name), (snapshot) => {
    const data = snapshot.docs.map((docItem) => ({
      id: Number(docItem.id),
      ...docItem.data(),
    })) as T[];

    callback(data);
  });
}

// 🔥 зберегти
export async function saveItem<T extends { id: number }>(
  collectionName: string,
  item: T
) {
  await setDoc(doc(db, collectionName, String(item.id)), item);
}

// 🔥 видалити
export async function deleteItem(collectionName: string, id: number) {
  await deleteDoc(doc(db, collectionName, String(id)));
}
