
"use client";

import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth) {
        setLoading(false);
        // If firebase is not configured and we are not on the login page, redirect.
        if (pathname !== '/login') {
            router.replace('/login');
        }
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser && pathname !== '/login') {
          router.replace('/login');
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const signOut = async () => {
    if(auth) {
        await firebaseSignOut(auth);
    }
    router.push('/login');
  };

  return { user, loading, signOut, setUser: setUser as Dispatch<SetStateAction<User | null>> };
}
