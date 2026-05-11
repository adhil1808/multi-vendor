import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
           setUser({ id: firebaseUser.uid, ...userDoc.data() });
        } else {
           console.error("User document not found in Firestore!");
           setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (identifier, password) => {
    setLoading(true);
    setError('');
    try {
      let emailToUse = identifier;
      
      // Handle Super Admin shorthand
      if (identifier === 'adhil@fooddies') {
        emailToUse = 'adhil@fooddies.com';
      }
      
      // If the identifier doesn't look like an email, assume it's a Restaurant ID
      else if (!identifier.includes('@')) {
         const mQ = query(collection(db, "merchants"), where("restaurantId", "==", identifier));
         const mSnap = await getDocs(mQ);
         if (!mSnap.empty) {
            const mDoc = mSnap.docs[0].data();
            const uDoc = await getDoc(doc(db, "users", mDoc.userId));
            if (uDoc.exists()) {
               emailToUse = uDoc.data().email;
            }
         }
      }

      await signInWithEmailAndPassword(auth, emailToUse, password);
    } catch (err) {
      console.error(err);
      setError("Invalid credentials or user not found.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateUserProfile = async (data) => {
      if (!user) return;
      try {
          await setDoc(doc(db, "users", user.id), data, { merge: true });
          setUser({ ...user, ...data });
      } catch (err) {
          console.error("Error updating profile:", err);
      }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserProfile, loading, error }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
