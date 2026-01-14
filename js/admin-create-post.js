// js/admin-create-post.js
// Handle creating and editing blog posts from admin panel

import { db, storage } from "./firebase-init.js";
import {
  addDoc,
  collection,
  Timestamp,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

const modal = document.getElementById("createPostModal");
const openBtn = document.getElementById("newNarrativeBtn");
const cancelBtn = document.getElementById("cancelPostBtn");
const cancelBtn2 = document.getElementById("cancelPostBtn2");
const saveBtn = document.getElementById("savePostBtn");

const titleInput = document.getElementById("postTitle");
const dateInput = document.getElementById("postDate");
const contentInput = document.getElementById("postContent");
const publishedInput = document.getElementById("postPublished");
const coverFileInput = document.getElementById("postCoverFile");
const coverPreview = document.getElementById("postCoverPreview");
const messageDiv = document.getElementById("postMessage");

// Set default date to today
dateInput.valueAsDate = new Date();

// Open modal for creating new post
openBtn.addEventListener("click", () => {
  // Reset to create mode
  window.currentEditPostId = null;
  window.currentEditCoverUrl = "";

  // Reset modal text
  const modalHeader = document.querySelector("#createPostModal h2");
  modalHeader.textContent = "Create New Story";
  saveBtn.textContent = "Save Story";

  modal.classList.remove("hidden");
});

// Close modal
function closeModal() {
  modal.classList.add("hidden");
  resetForm();
}

cancelBtn.addEventListener("click", closeModal);
cancelBtn2.addEventListener("click", closeModal);

// Reset form
function resetForm() {
  // Clear edit mode
  window.currentEditPostId = null;
  window.currentEditCoverUrl = "";

  // Reset modal text
  const modalHeader = document.querySelector("#createPostModal h2");
  modalHeader.textContent = "Create New Story";
  saveBtn.textContent = "Save Story";
  titleInput.value = "";
  dateInput.valueAsDate = new Date();
  contentInput.value = "";
  publishedInput.checked = true;
  coverFileInput.value = "";
  coverPreview.classList.add("hidden");
  coverPreview.querySelector("img").src = "";
  messageDiv.classList.add("hidden");
  messageDiv.textContent = "";
}

// Show message
function showMessage(text, isError = false) {
  messageDiv.textContent = text;
  messageDiv.classList.remove(
    "hidden",
    "bg-green-50",
    "text-green-800",
    "bg-red-50",
    "text-red-800"
  );
  if (isError) {
    messageDiv.classList.add("bg-red-50", "text-red-800");
  } else {
    messageDiv.classList.add("bg-green-50", "text-green-800");
  }
}

// Generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
}

// Preview image
coverFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      coverPreview.querySelector("img").src = event.target.result;
      coverPreview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }
});

// Save button (create or update)
saveBtn.addEventListener("click", async () => {
  console.log("Save button clicked");

  const isEditMode = !!window.currentEditPostId;
  console.log("Mode:", isEditMode ? "EDIT" : "CREATE");

  const title = titleInput.value.trim();
  const dateStr = dateInput.value;
  const content = contentInput.value.trim();
  const published = publishedInput.checked;
  const coverFile = coverFileInput.files[0];

  console.log("Form data:", {
    title,
    date: dateStr,
    content,
    published,
    coverFile: coverFile?.name,
    editMode: isEditMode,
    editPostId: window.currentEditPostId,
  });

  // Validate
  if (!title) {
    showMessage("Please enter a title", true);
    return;
  }
  if (!dateStr) {
    showMessage("Please select a date", true);
    return;
  }
  if (!content) {
    showMessage("Please enter story content", true);
    return;
  }

  // Generate slug
  const slug = generateSlug(title);
  console.log("Generated slug:", slug);

  // Convert user-selected date to Firestore Timestamp at midnight local time
  console.log("Chosen date input:", dateStr);
  const [y, m, d] = dateStr.split("-").map(Number);
  const jsDate = new Date(y, m - 1, d, 0, 0, 0);
  console.log("Chosen timestamp ISO:", jsDate.toISOString());
  const chosenTimestamp = Timestamp.fromDate(jsDate);
  console.log("Firestore Timestamp created:", chosenTimestamp);

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    let coverImageUrl = window.currentEditCoverUrl || "";

    // Upload cover image if new file selected
    if (coverFile) {
      console.log("Uploading cover image...");
      try {
        const storageRef = ref(
          storage,
          `post-images/${slug}/${Date.now()}-${coverFile.name}`
        );
        console.log("Storage ref created:", storageRef.fullPath);

        await uploadBytes(storageRef, coverFile);
        console.log("Upload complete, getting download URL...");

        coverImageUrl = await getDownloadURL(storageRef);
        console.log("Cover image uploaded:", coverImageUrl);
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        throw new Error("Failed to upload image: " + uploadError.message);
      }
    }

    // Prepare post data
    const postData = {
      title,
      slug,
      content,
      date: chosenTimestamp,
      published,
      coverImageUrl,
    };

    if (isEditMode) {
      // UPDATE existing post
      console.log("Updating post with ID:", window.currentEditPostId);
      const docRef = doc(db, "posts", window.currentEditPostId);
      await updateDoc(docRef, postData);
      console.log("Post updated successfully");
      showMessage("Saved! Post updated successfully.");
    } else {
      // CREATE new post
      console.log("Creating new post document with data:", postData);
      const docRef = await addDoc(collection(db, "posts"), postData);
      console.log("Post created successfully with ID:", docRef.id);
      showMessage("Saved! Post created successfully.");
    }

    // Reset button state immediately before closing
    saveBtn.disabled = false;
    saveBtn.textContent = isEditMode ? "Save Changes" : "Save Story";

    setTimeout(async () => {
      closeModal();
      // Reload stories list if admin-stories.js is loaded
      if (typeof window.loadStoriesList === "function") {
        try {
          await window.loadStoriesList();
        } catch (reloadErr) {
          console.error("Error reloading stories list:", reloadErr);
        }
      }
    }, 1500);
  } catch (error) {
    console.error("Error saving post:", error);
    if (error && typeof error === "object") {
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
    }
    showMessage(
      "Error saving post: " + (error && error.message ? error.message : error),
      true
    );
    // Ensure button is reset on error
    saveBtn.disabled = false;
    saveBtn.textContent = isEditMode ? "Save Changes" : "Save Story";
  }
});
