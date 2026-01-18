// js/entries-firebase.js
// Fetch and render published posts from Firestore with grid/vertical toggle
import { db } from "./firebase-init.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const postsContainer = document.getElementById("firebase-posts");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const verticalViewBtn = document.getElementById("verticalViewBtn");
const gridViewBtn = document.getElementById("gridViewBtn");

let allPosts = [];
let currentView = localStorage.getItem("viewMode") || "vertical";

// Set initial view
function setInitialView() {
  if (currentView === "grid") {
    gridViewBtn.classList.add("active");
    verticalViewBtn.classList.remove("active");
    postsContainer.classList.add("grid-layout");
  } else {
    verticalViewBtn.classList.add("active");
    gridViewBtn.classList.remove("active");
    postsContainer.classList.remove("grid-layout");
  }
}

// View toggle handlers
if (verticalViewBtn) {
  verticalViewBtn.addEventListener("click", () => {
    currentView = "vertical";
    localStorage.setItem("viewMode", "vertical");
    verticalViewBtn.classList.add("active");
    gridViewBtn.classList.remove("active");
    postsContainer.classList.remove("grid-layout");
    postsContainer.classList.add("flex", "flex-col", "gap-24");
    renderPosts();
  });
}

if (gridViewBtn) {
  gridViewBtn.addEventListener("click", () => {
    currentView = "grid";
    localStorage.setItem("viewMode", "grid");
    gridViewBtn.classList.add("active");
    verticalViewBtn.classList.remove("active");
    postsContainer.classList.remove("flex", "flex-col", "gap-24");
    postsContainer.classList.add("grid-layout");
    renderPosts();
  });
}

async function fetchPosts() {
  try {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, where("published", "==", true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      postsContainer.innerHTML =
        '<p class="text-center text-warm-brown/60 font-sans text-sm col-span-full">No published posts yet.</p>';
      return;
    }

    allPosts = [];
    snapshot.forEach((doc) => {
      const post = doc.data();
      post.id = doc.id;
      allPosts.push(post);
    });

    setInitialView();
    renderPosts();
  } catch (err) {
    console.error("Error fetching posts:", err);
    postsContainer.innerHTML =
      '<p class="text-center text-red-600 font-sans text-sm col-span-full">Error loading posts. Check console for details.</p>';
  }
}

function renderPosts(searchTerm = "", sortOrder = "new") {
  let posts = [...allPosts];

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    posts = posts.filter((post) => {
      const title = (post.title || "").toLowerCase();
      const content = (post.content || "").toLowerCase();
      return title.includes(term) || content.includes(term);
    });
  }

  posts.sort((a, b) => {
    const dateA = a.date && a.date.toDate ? a.date.toDate() : new Date(0);
    const dateB = b.date && b.date.toDate ? b.date.toDate() : new Date(0);
    return sortOrder === "new" ? dateB - dateA : dateA - dateB;
  });

  if (posts.length === 0) {
    postsContainer.innerHTML =
      '<p class="text-center text-warm-brown/60 font-sans text-sm col-span-full">No stories found.</p>';
    return;
  }

  const isGrid = currentView === "grid";
  let html = "";

  posts.forEach((post, index) => {
    const title = post.title || "Untitled";
    const date = post.date && post.date.toDate ? post.date.toDate() : null;
    const dateStr = date
      ? date.toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";
    const content = post.content || "";
    const preview =
      content.length > (isGrid ? 120 : 160)
        ? content.slice(0, isGrid ? 117 : 157) + "..."
        : content;
    const coverImageUrl = post.coverImageUrl;
    const slug = post.slug || post.id;

    const cardClass = isGrid
      ? "story-card bg-white/40 border border-warm-brown/5 rounded-2xl p-4 shadow-sm transition-all hover:shadow-md hover:bg-white/60 h-full flex flex-col"
      : "bg-white/40 border border-warm-brown/5 rounded-2xl p-4 md:p-6 shadow-sm transition-all hover:shadow-md hover:bg-white/60";

    html += `
      <article class="w-full ${isGrid ? "" : "flex flex-col items-center"}">
        <a class="w-full ${
          isGrid ? "h-full" : "max-w-3xl"
        } group" href="story.html?slug=${slug}" data-slug="${slug}">
          <div class="${cardClass}">
            <div class="text-center mb-${isGrid ? "4" : "8"}">
              <h3 class="font-script text-${
                isGrid ? "3xl" : "4xl"
              } text-dark-brown mb-2">${title}</h3>
              <p class="font-sans text-[10px] uppercase tracking-[0.3em] text-burnt-orange font-semibold">${dateStr}</p>
            </div>
            ${
              coverImageUrl
                ? `<div class="mb-${
                    isGrid ? "4" : "6"
                  } aspect-[7/5] overflow-hidden rounded-xl shadow ${
                    isGrid ? "flex-shrink-0" : ""
                  }">
                    <img alt="${title}" class="w-full h-full object-cover" src="${coverImageUrl}" loading="lazy" />
                  </div>`
                : ""
            }
            <div class="max-w-2xl mx-auto text-center ${
              isGrid ? "story-content flex-1 flex flex-col justify-between" : ""
            }">
              <p class="text-${
                isGrid ? "base" : "lg"
              } leading-relaxed text-warm-brown/80 mb-4 italic ${
                isGrid ? "line-clamp-3" : ""
              }">${preview}</p>
              <div class="flex justify-center">
                <span class="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest font-bold text-burnt-orange hover:text-soft-terracotta transition-colors">
                  Read More
                  <span class="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </span>
              </div>
            </div>
          </div>
        </a>
      </article>
    `;
  });

  postsContainer.innerHTML = html;
}

// Search functionality
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value;
    const sortOrder = sortSelect ? sortSelect.value : "new";
    renderPosts(searchTerm, sortOrder);
  });
}

// Sort functionality
if (sortSelect) {
  sortSelect.addEventListener("change", (e) => {
    const sortOrder = e.target.value;
    const searchTerm = searchInput ? searchInput.value : "";
    renderPosts(searchTerm, sortOrder);
  });
}

fetchPosts();
