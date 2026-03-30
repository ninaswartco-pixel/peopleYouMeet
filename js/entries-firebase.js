// js/entries-firebase.js
// Fetch and render published posts from Firestore with grid/vertical toggle
import { db } from "./firebase-init.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { hasLiked, addLike, removeLike, getSubscriberEmail } from "./likes.js";

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
    // Strip HTML tags for preview, keep plain text with spacing
    const plainContent = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const maxLen = isGrid ? 120 : 160;
    const preview =
      plainContent.length > maxLen
        ? plainContent.slice(0, maxLen - 3) + "..."
        : plainContent;
    const coverImageUrl = post.coverImageUrl;
    const slug = post.slug || post.id;
    const postId = post.id;
    const liked = hasLiked(postId);

    const cardClass = isGrid
      ? "story-card bg-white/40 border border-warm-brown/5 rounded-2xl p-3 md:p-4 shadow-sm transition-all hover:shadow-md hover:bg-white/60 h-full flex flex-col"
      : "bg-white/40 border border-warm-brown/5 rounded-xl md:rounded-2xl p-2 md:p-4 lg:p-6 shadow-sm transition-all hover:shadow-md hover:bg-white/60";

    html += `
      <article class="w-full ${isGrid ? "" : "flex flex-col items-center"}">
        <a class="w-full ${
          isGrid ? "h-full" : "max-w-3xl"
        } group" href="story.html?slug=${slug}" data-slug="${slug}">
          <div class="${cardClass} relative">
            <div class="absolute top-2 right-2 md:top-3 md:right-3 flex gap-1 z-10 ${isGrid ? "grid-mobile-hide" : ""}">
              <button class="like-btn p-2 rounded-full hover:text-red-500 transition-all" style="color:${liked ? "#ef4444" : "rgba(92,64,51,0.25)"}" data-post-id="${postId}" title="Like">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${liked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>
              <button class="share-btn p-2 rounded-full text-warm-brown/25 hover:text-warm-brown/60 hover:bg-warm-brown/5 transition-all" data-share-title="${title}" data-share-slug="${slug}" title="Share">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </button>
            </div>
            ${
              isGrid && coverImageUrl
                ? `<div class="grid-mobile-image mb-0 sm:mb-3 aspect-[7/5] overflow-hidden rounded-xl sm:rounded-xl shadow flex-shrink-0">
                    <img alt="${title}" class="w-full h-full object-cover" src="${coverImageUrl}" loading="lazy" />
                  </div>
                  <div class="grid-mobile-title text-center mb-0 sm:mb-3 pt-1">
                    <h3 class="font-script text-2xl md:text-3xl text-dark-brown mb-0">${title}</h3>
                    <p class="font-sans text-[10px] uppercase tracking-[0.3em] text-burnt-orange font-semibold hidden sm:block">${dateStr}</p>
                  </div>`
                : `<div class="text-center mb-2 md:mb-8">
                    <h3 class="font-script ${
                      isGrid ? "text-2xl md:text-3xl" : "text-2xl md:text-4xl"
                    } text-dark-brown mb-0.5">${title}</h3>
                    <p class="font-sans text-[10px] uppercase tracking-[0.3em] text-burnt-orange font-semibold">${dateStr}</p>
                  </div>
                  ${
                    coverImageUrl
                      ? `<div class="mb-2 md:mb-6 aspect-[7/5] overflow-hidden rounded-lg md:rounded-xl shadow">
                          <img alt="${title}" class="w-full h-full object-cover" src="${coverImageUrl}" loading="lazy" />
                        </div>`
                      : ""
                  }`
            }
            <div class="max-w-2xl mx-auto text-center ${
              isGrid ? "story-content flex-1 flex flex-col justify-between grid-mobile-hide" : ""
            }">
              <p class="text-sm md:text-${
                isGrid ? "base" : "lg"
              } leading-relaxed text-warm-brown/80 mb-2 md:mb-4 italic ${
                isGrid ? "line-clamp-3" : "line-clamp-3 md:line-clamp-none"
              }">${preview}</p>
              <div class="flex justify-center">
                <span class="inline-flex items-center gap-2 font-sans text-[10px] md:text-xs uppercase tracking-widest font-bold text-burnt-orange hover:text-soft-terracotta transition-colors">
                  Read More
                  <span class="material-symbols-outlined text-[16px] md:text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </span>
              </div>
            </div>
          </div>
        </a>
      </article>
    `;
  });

  postsContainer.innerHTML = html;

  // Like button handlers
  postsContainer.querySelectorAll(".like-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const postId = btn.dataset.postId;
      const svg = btn.querySelector("svg");
      const alreadyLiked = hasLiked(postId);

      if (alreadyLiked) {
        await removeLike(postId);
        btn.style.color = "rgba(92,64,51,0.25)";
        svg.setAttribute("fill", "none");
        return;
      }

      // If subscriber, like immediately
      if (getSubscriberEmail()) {
        await addLike(postId);
        btn.style.color = "#ef4444";
        svg.setAttribute("fill", "currentColor");
        return;
      }

      // Not a subscriber — show name prompt
      showLikePrompt(postId, btn, svg);
    });
  });

  // Share button handlers
  postsContainer.querySelectorAll(".share-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Remove any existing share menu
      document.querySelectorAll(".share-menu").forEach((m) => m.remove());

      const title = btn.dataset.shareTitle;
      const url = `${window.location.origin}/story.html?slug=${btn.dataset.shareSlug}`;

      const menu = document.createElement("div");
      menu.className = "share-menu";
      menu.style.cssText = "position:absolute;top:100%;right:0;background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:10px;padding:6px 0;box-shadow:0 4px 16px rgba(0,0,0,0.08);z-index:50;min-width:150px;font-family:sans-serif;font-size:13px;";

      const copyItem = document.createElement("button");
      copyItem.textContent = "Copy link";
      copyItem.style.cssText = "display:flex;align-items:center;gap:8px;width:100%;padding:8px 14px;border:none;background:none;cursor:pointer;color:#5a4a3a;text-align:left;";
      copyItem.onmouseenter = () => copyItem.style.background = "rgba(0,0,0,0.04)";
      copyItem.onmouseleave = () => copyItem.style.background = "none";
      copyItem.addEventListener("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        await navigator.clipboard.writeText(url);
        copyItem.textContent = "Copied!";
        setTimeout(() => menu.remove(), 1000);
      });
      menu.appendChild(copyItem);

      if (navigator.share) {
        const shareItem = document.createElement("button");
        shareItem.textContent = "Share...";
        shareItem.style.cssText = "display:flex;align-items:center;gap:8px;width:100%;padding:8px 14px;border:none;background:none;cursor:pointer;color:#5a4a3a;text-align:left;";
        shareItem.onmouseenter = () => shareItem.style.background = "rgba(0,0,0,0.04)";
        shareItem.onmouseleave = () => shareItem.style.background = "none";
        shareItem.addEventListener("click", async (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          try { await navigator.share({ title, url }); } catch {}
          menu.remove();
        });
        menu.appendChild(shareItem);
      }

      const rect = btn.getBoundingClientRect();
      menu.style.position = "fixed";
      menu.style.top = `${rect.bottom + 4}px`;
      menu.style.right = `${window.innerWidth - rect.right}px`;
      document.body.appendChild(menu);

      const closeMenu = (ev) => {
        if (!menu.contains(ev.target) && ev.target !== btn) {
          menu.remove();
          document.removeEventListener("click", closeMenu);
        }
      };
      setTimeout(() => document.addEventListener("click", closeMenu), 0);
    });
  });
}

// Like name prompt for non-subscribers
function showLikePrompt(postId, btn, svg) {
  document.querySelectorAll(".like-prompt").forEach((m) => m.remove());

  const prompt = document.createElement("div");
  prompt.className = "like-prompt";
  prompt.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(92,64,51,0.3);backdrop-filter:blur(4px);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;";

  prompt.innerHTML = `
    <div style="background:#FDFBF7;border-radius:20px;padding:32px;max-width:320px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,0.12);font-family:'Montserrat',sans-serif;text-align:center;">
      <p style="font-size:14px;color:#5C4033;margin-bottom:20px;">Leave your name so Carla knows who liked her story</p>
      <input type="text" placeholder="Your name" style="width:100%;padding:10px 16px;border:1px solid rgba(92,64,51,0.15);border-radius:12px;font-size:14px;color:#5C4033;outline:none;margin-bottom:12px;background:rgba(255,255,255,0.6);font-family:'Montserrat',sans-serif;" />
      <button class="like-prompt-submit" style="width:100%;padding:10px;background:#BF5700;color:white;border:none;border-radius:12px;font-size:12px;text-transform:uppercase;letter-spacing:2px;cursor:pointer;font-family:'Montserrat',sans-serif;margin-bottom:8px;">Like</button>
      <button class="like-prompt-anon" style="width:100%;padding:10px;background:rgba(92,64,51,0.06);border:none;border-radius:12px;color:#5C4033;font-size:13px;font-weight:500;cursor:pointer;font-family:'Montserrat',sans-serif;">Like anonymously</button>
    </div>
  `;

  document.body.appendChild(prompt);

  const input = prompt.querySelector("input");
  input.focus();

  const doLike = async (name) => {
    prompt.remove();
    await addLike(postId, name);
    btn.style.color = "#ef4444";
    svg.setAttribute("fill", "currentColor");
  };

  prompt.querySelector(".like-prompt-submit").addEventListener("click", () => {
    doLike(input.value.trim() || "Anonymous");
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doLike(input.value.trim() || "Anonymous");
  });
  prompt.querySelector(".like-prompt-anon").addEventListener("click", () => {
    doLike("Anonymous");
  });
  prompt.addEventListener("click", (e) => {
    if (e.target === prompt) prompt.remove();
  });
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
