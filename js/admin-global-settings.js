// js/admin-global-settings.js
// Handles editing and saving global site settings (title and author)
import { db } from "./firebase-init.js";
import {
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const siteTitleInput = document.getElementById("siteTitleInput");
const siteAuthorInput = document.getElementById("siteAuthorInput");
const saveBtn = document.getElementById("saveGlobalSettingsBtn");
const statusMsg = document.getElementById("globalSettingsStatus");

async function loadGlobalSettings() {
  try {
    const docRef = doc(db, "siteSettings", "global");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      siteTitleInput.value = data.siteTitle || "The People We Meet";
      siteAuthorInput.value = data.siteAuthor || "Carla Schultz";
    } else {
      siteTitleInput.value = "The People We Meet";
      siteAuthorInput.value = "Carla Schultz";
    }
    console.log("Settings loaded from Firestore");
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
}

saveBtn.addEventListener("click", async () => {
  const title = siteTitleInput.value.trim();
  const author = siteAuthorInput.value.trim();

  try {
    await setDoc(
      doc(db, "siteSettings", "global"),
      { siteTitle: title, siteAuthor: author },
      { merge: true }
    );

    statusMsg.textContent = "Saved!";
    statusMsg.className = "text-green-600 text-xs mt-2";
    setTimeout(() => (statusMsg.textContent = ""), 2000);

    console.log("Settings saved to Firestore:", { title, author });
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
});

// Load settings on page load
if (siteTitleInput && siteAuthorInput) loadGlobalSettings();
