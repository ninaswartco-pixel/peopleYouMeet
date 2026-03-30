// js/subscribe.js
// Handle newsletter subscribe/unsubscribe via Firestore

import { db } from "./firebase-init.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const subscribersRef = collection(db, "subscribers");

// Generate a simple unsubscribe token
function generateToken() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Subscribe an email
export async function subscribe(email) {
  // Check if already subscribed
  const q = query(subscribersRef, where("email", "==", email.toLowerCase()));
  const existing = await getDocs(q);
  if (!existing.empty) {
    return { success: false, message: "You're already subscribed!" };
  }

  const token = generateToken();
  // Store email locally so likes can identify this subscriber
  localStorage.setItem("subscriberEmail", email.toLowerCase());
  await addDoc(subscribersRef, {
    email: email.toLowerCase(),
    token,
    subscribedAt: new Date(),
  });

  return { success: true, message: "You're subscribed! You'll be notified when Carla posts." };
}

// Unsubscribe by token
export async function unsubscribeByToken(token) {
  const q = query(subscribersRef, where("token", "==", token));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return { success: false, message: "Subscription not found or already removed." };
  }
  for (const docSnap of snapshot.docs) {
    await deleteDoc(docSnap.ref);
  }
  return { success: true, message: "You've been unsubscribed. You won't receive further emails." };
}

// Unsubscribe by email (also clears local subscriber state)
export async function unsubscribeByEmail(email) {
  localStorage.removeItem("subscriberEmail");
  const q = query(subscribersRef, where("email", "==", email.toLowerCase()));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return { success: false, message: "This email is not subscribed." };
  }
  for (const docSnap of snapshot.docs) {
    await deleteDoc(docSnap.ref);
  }
  return { success: true, message: "You've been unsubscribed successfully." };
}
