// js/admin-hero-upload.js
// Handles hero/background image upload to Firebase Storage
import { auth, db, storage } from "./firebase-init.js";
import {
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

const heroUploadBox = document.getElementById("heroUploadBox");
const heroImageFile = document.getElementById("heroImageFile");
const heroPreview = document.getElementById("heroPreview");

// Load existing hero image on page load
async function loadHeroImage() {
  try {
    const docRef = doc(db, "siteSettings", "global");
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().heroImageUrl) {
      const imageUrl = snap.data().heroImageUrl;
      if (heroPreview) {
        heroPreview.src = imageUrl;
        heroPreview.classList.remove("hidden");
      }
      console.log("Loaded existing hero image:", imageUrl);
    }
  } catch (e) {
    console.error("Failed to load hero image:", e);
  }
}

// Trigger file picker when upload box is clicked
if (heroUploadBox) {
  heroUploadBox.addEventListener("click", () => {
    heroImageFile.click();
  });
}

// Handle file upload
if (heroImageFile) {
  heroImageFile.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to upload images.");
      console.error("Upload blocked: User not authenticated");
      return;
    }

    console.log("Starting hero image upload...");

    try {
      // Create sanitized filename with timestamp
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `site/hero/${timestamp}-${sanitizedName}`;

      // Upload to Firebase Storage
      const storageRef = ref(storage, storagePath);
      console.log("Uploading to:", storagePath);

      const snapshot = await uploadBytes(storageRef, file);
      console.log("Upload successful:", snapshot);

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log("Download URL:", downloadURL);

      // Save URL to Firestore
      await setDoc(
        doc(db, "siteSettings", "global"),
        { heroImageUrl: downloadURL },
        { merge: true }
      );
      console.log("Hero image URL saved to Firestore");

      // Show preview
      if (heroPreview) {
        heroPreview.src = downloadURL;
        heroPreview.classList.remove("hidden");
      }

      alert("Hero image uploaded successfully!");
    } catch (error) {
      console.error("Hero image upload failed:", error);
      alert("Failed to upload hero image. Check console for details.");
    }
  });
}

// Load existing image on page load
loadHeroImage();
