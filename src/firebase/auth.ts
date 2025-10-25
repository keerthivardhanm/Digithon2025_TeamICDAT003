'use client';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type UserCredential
} from 'firebase/auth';
import { initializeFirebase } from '.';

const { auth } = initializeFirebase();

export const createNewUser = async (email: string, password: string): Promise<UserCredential['user'] | null> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<UserCredential['user'] | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string): Promise<UserCredential['user'] | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // In a real app, you might want to send a verification email here
      // and also create a user document in Firestore.
      return userCredential.user;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};
