// js/admin-global-settings.js
// Handles editing and saving global site settings (title, author, colors)
import { db } from "./firebase-init.js";
import {
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const siteTitleInput = document.getElementById("siteTitleInput");
const siteAuthorInput = document.getElementById("siteAuthorInput");
const themeColorInput = document.getElementById("themeColorInput");
const postBgColorInput = document.getElementById("postBgColorInput");
const titleFontSelect = document.getElementById("titleFontSelect");
const authorFontSelect = document.getElementById("authorFontSelect");
const bodyFontSelect = document.getElementById("bodyFontSelect");
const saveBtn = document.getElementById("saveGlobalSettingsBtn");

// Handle color swatch clicks
document.querySelectorAll(".color-swatch").forEach((swatch) => {
  swatch.addEventListener("click", () => {
    const color = swatch.dataset.color;
    themeColorInput.value = color;
    // Update preview
    document.documentElement.style.setProperty("--theme-primary", color);
  });
});

document.querySelectorAll(".bg-color-swatch").forEach((swatch) => {
  swatch.addEventListener("click", () => {
    const color = swatch.dataset.bgColor;
    postBgColorInput.value = color;
  });
});

async function loadGlobalSettings() {
  try {
    const docRef = doc(db, "siteSettings", "global");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      siteTitleInput.value = data.siteTitle || "The People We Meet";
      siteAuthorInput.value = data.siteAuthor || "Carla Schultz";
      themeColorInput.value = data.themeColor || "#CC5500";
      postBgColorInput.value = data.postBgColor || "#FFFFFF";
      titleFontSelect.value = data.titleFont || "greatVibes";
      authorFontSelect.value = data.authorFont || "italiana";
      bodyFontSelect.value = data.bodyFont || "montserrat";

      // Apply theme color to current page
      if (data.themeColor) {
        document.documentElement.style.setProperty(
          "--theme-primary",
          data.themeColor
        );
      }
      console.log("Loaded fonts:", {
        titleFont: data.titleFont,
        authorFont: data.authorFont,
        bodyFont: data.bodyFont,
      });
    } else {
      siteTitleInput.value = "The People We Meet";
      siteAuthorInput.value = "Carla Schultz";
      themeColorInput.value = "#CC5500";
      postBgColorInput.value = "#FFFFFF";
      titleFontSelect.value = "greatVibes";
      authorFontSelect.value = "italiana";
      bodyFontSelect.value = "montserrat";
    }
    console.log("Settings loaded from Firestore");
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
}

saveBtn.addEventListener("click", async () => {
  const originalText = saveBtn.textContent;
  const title = siteTitleInput.value.trim();
  const author = siteAuthorInput.value.trim();
  const themeColor = themeColorInput.value.trim();
  const postBgColor = postBgColorInput.value.trim();
  const titleFont = titleFontSelect.value;
  const authorFont = authorFontSelect.value;
  const bodyFont = bodyFontSelect.value;

  try {
    await setDoc(
      doc(db, "siteSettings", "global"),
      {
        siteTitle: title,
        siteAuthor: author,
        themeColor: themeColor,
        postBgColor: postBgColor,
        titleFont: titleFont,
        authorFont: authorFont,
        bodyFont: bodyFont,
        authorVisible: true,
      },
      { merge: true }
    );

    // Change button text to "Changes Saved"
    saveBtn.textContent = "Changes Saved";
    saveBtn.classList.add("bg-[var(--theme-primary)]", "text-white");

    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.classList.remove("bg-[var(--theme-primary)]", "text-white");
    }, 2000);

    console.log("Settings saved to Firestore:", {
      title,
      author,
      themeColor,
      postBgColor,
      titleFont,
      authorFont,
      bodyFont,
    });
  } catch (e) {
    console.error("Failed to save settings:", e);
    saveBtn.textContent = "Save Failed";
    setTimeout(() => {
      saveBtn.textContent = originalText;
    }, 2000);
  }
});

// Load settings on page load
if (siteTitleInput && siteAuthorInput) loadGlobalSettings();
