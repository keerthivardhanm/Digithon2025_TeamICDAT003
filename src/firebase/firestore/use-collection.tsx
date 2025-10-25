'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, where, type Query, type CollectionReference, type DocumentData } from 'firebase/firestore';

interface DocumentWithId extends DocumentData {
  id: string;
}

export function useCollection<T extends DocumentData>(
  ref: CollectionReference<T> | Query<T> | null,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setLoading(true);
        const docs = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        } as T & { id: string }));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching collection: ", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
}
