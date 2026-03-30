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

      const likeCount = post.likes || 0; // May be stale, actual count loaded on click
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
        <div class="border border-slate-50 hover:border-[var(--theme-primary)] transition-all bg-soft-grey">
          <div class="group flex items-center justify-between p-6">
            <div class="flex items-center gap-6 flex-1 cursor-pointer" data-edit-id="${postId}">
              ${thumbnailHtml}
              <div>
                <h3 class="text-xl group-hover:text-[var(--theme-primary)] transition-colors">${title}</h3>
                <div class="flex items-center gap-3 mt-1">
                  <p class="text-[10px] uppercase tracking-widest text-slate-400">${statusLabel}</p>
                  <button class="likes-toggle inline-flex items-center gap-1 text-[10px] uppercase tracking-widest ${likeCount > 0 ? "text-red-400" : "text-slate-300"} hover:text-red-500 transition-colors cursor-pointer" data-post-id="${postId}" title="View who liked">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="${likeCount > 0 ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    ${likeCount}
                  </button>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <button data-edit-id="${postId}" class="material-symbols-outlined text-slate-300 group-hover:text-[var(--theme-primary)] transition-colors" title="Edit">edit</button>
              <button data-delete-id="${postId}" class="material-symbols-outlined text-slate-300 hover:text-red-500 transition-colors" title="Delete">delete</button>
            </div>
          </div>
          <div class="likes-detail hidden border-t border-slate-100 px-6 py-4" data-likes-for="${postId}">
            <p class="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Loading...</p>
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

  // Likes toggle buttons
  const likesToggleBtns = document.querySelectorAll(".likes-toggle");
  likesToggleBtns.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const postId = btn.dataset.postId;
      const detailDiv = document.querySelector(`[data-likes-for="${postId}"]`);
      if (!detailDiv) return;

      // Toggle visibility
      if (!detailDiv.classList.contains("hidden")) {
        detailDiv.classList.add("hidden");
        return;
      }

      detailDiv.classList.remove("hidden");
      detailDiv.innerHTML = '<p class="text-[10px] uppercase tracking-widest text-slate-400">Loading...</p>';

      // Fetch likes subcollection
      try {
        const likesRef = collection(db, "posts", postId, "likes");
        const likesSnap = await getDocs(likesRef);

        if (likesSnap.empty) {
          detailDiv.innerHTML = '<p class="text-[11px] text-slate-400 italic">No likes yet</p>';
          return;
        }

        let likesHtml = '<p class="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Liked by</p><div class="flex flex-wrap gap-2">';
        likesSnap.forEach((likeDoc) => {
          const like = likeDoc.data();
          const name = like.name || "Anonymous";
          const isSubscriber = like.isSubscriber;
          const email = like.email || "";
          const label = isSubscriber ? `${name} (${email})` : name;
          const badgeColor = isSubscriber ? "bg-red-50 text-red-400 border-red-100" : "bg-slate-50 text-slate-500 border-slate-100";
          likesHtml += `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] border ${badgeColor}">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            ${label}
          </span>`;
        });
        likesHtml += '</div>';
        detailDiv.innerHTML = likesHtml;
      } catch (err) {
        console.error("Error loading likes:", err);
        detailDiv.innerHTML = '<p class="text-[11px] text-red-400">Error loading likes</p>';
      }
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
    document.getElementById("postContent").innerHTML = post.content || "";
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

    // Restore alignment setting
    const alignLeftBtn = document.getElementById("alignLeftBtn");
    const alignCenterBtn = document.getElementById("alignCenterBtn");
    const align = post.textAlign || "center";
    // Update the shared selectedAlignment variable via a click
    if (align === "left") {
      alignLeftBtn.click();
    } else {
      alignCenterBtn.click();
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
