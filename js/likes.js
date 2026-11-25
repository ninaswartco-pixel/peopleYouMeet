// js/likes.js
// Post likes. The work happens in Cloud Functions (functions/index.js).

import { app } from "./firebase-init.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-functions.js";

const functions = getFunctions(app);

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

// Add a like (name is used only for visitors who are not subscribers)
export async function addLike(postId, name) {
  await httpsCallable(functions, "likePost")({
    postId,
    localId: getLocalId(),
    name: name || "",
    email: getSubscriberEmail() || "",
  });
  setLiked(postId, true);
  return { liked: true };
}

// Remove this visitor's like
export async function removeLike(postId) {
  await httpsCallable(functions, "unlikePost")({ postId, localId: getLocalId() });
  setLiked(postId, false);
  return { liked: false };
}
