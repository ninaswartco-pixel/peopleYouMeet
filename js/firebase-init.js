import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAUyWhYCqK57FRp0UA7Cz9HSIbc9uQkemw",
  authDomain: "peopleyoumeet-a9566.firebaseapp.com",
  projectId: "peopleyoumeet-a9566",
  storageBucket: "peopleyoumeet-a9566.firebasestorage.app",
  messagingSenderId: "235351478819",
  appId: "1:235351478819:web:b68ce65d34ab5999a99796",
  measurementId: "G-YMVZ991G74",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(
  app,
  "gs://peopleyoumeet-a9566.firebasestorage.app"
);

console.log("Firebase Storage bucket:", firebaseConfig.storageBucket);
