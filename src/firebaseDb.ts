import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

type WithId = {
  id: number;
};

export async function loadCollection<T extends WithId>(
  name: string
): Promise<T[]> {
  const snapshot = await getDocs(collection(db, name));

  return snapshot.docs.map((docItem) => {
    return {
      id: Number(docItem.id),
      ...docItem.data(),
    } as T;
  });
}

export function subscribeCollection<T extends WithId>(
  name: string,
  callback: (data: T[]) => void
) {
  return onSnapshot(
    collection(db, name),
    (snapshot: QuerySnapshot<DocumentData>) => {
      const data = snapshot.docs.map((docItem) => {
        return {
          id: Number(docItem.id),
          ...docItem.data(),
        } as T;
      });

      callback(data);
    }
  );
}

export async function saveItem<T extends WithId>(
  collectionName: string,
  item: T
) {
  await setDoc(doc(db, collectionName, String(item.id)), item);
}

export async function deleteItem(collectionName: string, id: number) {
  await deleteDoc(doc(db, collectionName, String(id)));
}