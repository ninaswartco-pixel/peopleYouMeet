// js/subscribe.js
// Newsletter subscribe/unsubscribe. The work happens in Cloud Functions
// (functions/index.js), not in the browser.

import { app } from "./firebase-init.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-functions.js";

const functions = getFunctions(app);

function call(name) {
  return httpsCallable(functions, name);
}

// Subscribe an email
export async function subscribe(email) {
  const cleaned = email.trim().toLowerCase();
  const res = await call("subscribe")({ email: cleaned });
  // Remember the email on this browser so likes can identify this subscriber
  localStorage.setItem("subscriberEmail", cleaned);
  return res.data;
}

// Unsubscribe by token (from the link in the email)
export async function unsubscribeByToken(token) {
  const res = await call("unsubscribeByToken")({ token });
  return res.data;
}

// Unsubscribe by email (also clears local subscriber state)
export async function unsubscribeByEmail(email) {
  localStorage.removeItem("subscriberEmail");
  const res = await call("unsubscribeByEmail")({ email: email.trim().toLowerCase() });
  return res.data;
}
