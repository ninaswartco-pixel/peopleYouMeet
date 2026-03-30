// js/likes.js
// Handle post likes with identity tracking

import { db } from "./firebase-init.js";
import {
  doc,
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// Unique local ID for this browser
function getLocalId() {
  let id = localStorage.getItem("likeLocalId");
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("likeLocalId", id);
  }
  return id;
}

// Check if this user is a subscriber (stored during subscribe flow)
export function getSubscriberEmail() {
  return localStorage.getItem("subscriberEmail") || null;
}

export function hasLiked(postId) {
  try {
    const liked = JSON.parse(localStorage.getItem("likedPosts") || "{}");
    return !!liked[postId];
  } catch {
    return false;
  }
}

function setLiked(postId, value) {
  try {
    const liked = JSON.parse(localStorage.getItem("likedPosts") || "{}");
    if (value) {
      liked[postId] = true;
    } else {
      delete liked[postId];
    }
    localStorage.setItem("likedPosts", JSON.stringify(liked));
  } catch {}
}

// Add a like with identity info
export async function addLike(postId, name) {
  const localId = getLocalId();
  const email = getSubscriberEmail();

  const likeData = {
    localId,
    name: email || name || "Anonymous",
    isSubscriber: !!email,
    likedAt: new Date(),
  };
  if (email) likeData.email = email;

  await addDoc(collection(db, "posts", postId, "likes"), likeData);
  setLiked(postId, true);
  return { liked: true };
}

// Remove a like
export async function removeLike(postId) {
  const localId = getLocalId();
  const likesRef = collection(db, "posts", postId, "likes");
  const q = query(likesRef, where("localId", "==", localId));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
  setLiked(postId, false);
  return { liked: false };
}
