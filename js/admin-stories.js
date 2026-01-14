// js/admin-stories.js
// Load, edit, and delete stories from Firestore in admin panel

import { db } from "./firebase-init.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const storiesList = document.getElementById("storiesList");

// Export function to allow admin-create-post.js to trigger re-render
export async function loadStories() {
  console.log("Loading stories from Firestore...");

  try {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    console.log(`Found ${snapshot.size} stories`);

    if (snapshot.empty) {
      storiesList.innerHTML =
        '<p class="text-center text-slate-400 py-8">No stories yet. Click "New Narrative" to create one.</p>';
      return;
    }

    let html = "";

    snapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const postId = docSnap.id;

      const title = post.title || "Untitled";
      const published = post.published || false;
      const coverImageUrl = post.coverImageUrl;

      // Format date
      let dateStr = "";
      if (post.date && post.date.toDate) {
        const dateObj = post.date.toDate();
        dateStr = dateObj.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }

      const statusLabel = published
        ? `Published ${dateStr}`
        : `Draft • ${dateStr}`;

      // Thumbnail HTML
      const thumbnailHtml = coverImageUrl
        ? `<img alt="Thumbnail" class="w-16 h-16 object-cover grayscale group-hover:grayscale-0 transition-all" src="${coverImageUrl}" />`
        : `<div class="w-16 h-16 bg-slate-100 flex items-center justify-center">
             <span class="material-symbols-outlined text-slate-300">image</span>
           </div>`;

      html += `
        <div class="group flex items-center justify-between p-6 border border-slate-50 hover:border-[var(--theme-primary)] transition-all bg-soft-grey">
          <div class="flex items-center gap-6 flex-1 cursor-pointer" data-edit-id="${postId}">
            ${thumbnailHtml}
            <div>
              <h3 class="text-xl group-hover:text-[var(--theme-primary)] transition-colors">${title}</h3>
              <p class="text-[10px] uppercase tracking-widest text-slate-400 mt-1">${statusLabel}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button data-edit-id="${postId}" class="material-symbols-outlined text-slate-300 group-hover:text-[var(--theme-primary)] transition-colors" title="Edit">edit</button>
            <button data-delete-id="${postId}" class="material-symbols-outlined text-slate-300 hover:text-red-500 transition-colors" title="Delete">delete</button>
          </div>
        </div>
      `;
    });

    storiesList.innerHTML = html;

    // Add event listeners for edit and delete
    attachEventListeners();
  } catch (error) {
    console.error("Error loading stories:", error);
    storiesList.innerHTML =
      '<p class="text-center text-red-500 py-8">Error loading stories. Check console.</p>';
  }
}

// Make loadStories available globally for admin-create-post.js
window.loadStoriesList = loadStories;

function attachEventListeners() {
  // Edit buttons
  const editButtons = document.querySelectorAll("[data-edit-id]");
  editButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const postId = btn.getAttribute("data-edit-id");
      console.log("Edit clicked for post:", postId);
      await openEditModal(postId);
    });
  });

  // Delete buttons
  const deleteButtons = document.querySelectorAll("[data-delete-id]");
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const postId = btn.getAttribute("data-delete-id");
      console.log("Delete clicked for post:", postId);
      await deleteStory(postId);
    });
  });
}

async function openEditModal(postId) {
  try {
    // Get post data
    const docRef = doc(db, "posts", postId);
    const docSnap = await (
      await import(
        "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js"
      )
    ).getDoc(docRef);

    if (!docSnap.exists()) {
      alert("Post not found");
      return;
    }

    const post = docSnap.data();

    // Fill modal inputs
    document.getElementById("postTitle").value = post.title || "";
    document.getElementById("postContent").value = post.content || "";
    document.getElementById("postPublished").checked = post.published || false;

    // Format date for input (YYYY-MM-DD)
    if (post.date && post.date.toDate) {
      const dateObj = post.date.toDate();
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      document.getElementById("postDate").value = `${year}-${month}-${day}`;
    }

    // Show cover preview if exists
    if (post.coverImageUrl) {
      const coverPreview = document.getElementById("postCoverPreview");
      const coverImg = coverPreview.querySelector("img");
      coverImg.src = post.coverImageUrl;
      coverPreview.classList.remove("hidden");
    }

    // Store editing post ID globally
    window.currentEditPostId = postId;
    window.currentEditCoverUrl = post.coverImageUrl || "";

    // Change modal text
    const modalHeader = document.querySelector("#createPostModal h2");
    modalHeader.textContent = "Edit Story";

    const saveBtn = document.getElementById("savePostBtn");
    saveBtn.textContent = "Save Changes";

    // Open modal
    document.getElementById("createPostModal").classList.remove("hidden");

    console.log("Edit modal opened for post:", postId);
  } catch (error) {
    console.error("Error opening edit modal:", error);
    alert("Error loading post for editing");
  }
}

async function deleteStory(postId) {
  if (
    !confirm(
      "Are you sure you want to delete this story? This cannot be undone."
    )
  ) {
    return;
  }

  try {
    console.log("Deleting post:", postId);
    await deleteDoc(doc(db, "posts", postId));
    console.log("Post deleted successfully");

    // Reload stories list
    await loadStories();
  } catch (error) {
    console.error("Error deleting post:", error);
    alert("Error deleting post: " + error.message);
  }
}

// Initial load
console.log("Admin stories module loaded");
loadStories();
