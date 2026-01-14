// js/entries-firebase.js
// Fetch and render published posts from Firestore
import { db } from "./firebase-init.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const postsContainer = document.getElementById("firebase-posts");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
console.log("Firebase posts container found:", postsContainer);

let allPosts = [];

async function fetchPosts() {
  try {
    console.log("Starting to fetch posts from Firestore...");
    const postsRef = collection(db, "posts");
    console.log("Posts collection reference created");
    const q = query(postsRef, where("published", "==", true));
    console.log("Query created (without orderBy to avoid index requirement)");
    const snapshot = await getDocs(q);
    console.log("Fetched posts:", snapshot.size);

    if (snapshot.empty) {
      console.log("No published posts found");
      postsContainer.innerHTML =
        '<p class="text-center text-warm-brown/60 font-sans text-sm">No published posts yet.</p>';
      return;
    }

    // Get all posts and store them globally
    allPosts = [];
    snapshot.forEach((doc) => {
      const post = doc.data();
      post.id = doc.id;
      allPosts.push(post);
    });

    // Initial render with default sort (new faces first)
    renderPosts();
  } catch (err) {
    console.error("Error fetching posts:", err);
    postsContainer.innerHTML =
      '<p class="text-center text-red-600 font-sans text-sm">Error loading posts. Check console for details.</p>';
  }
}

function renderPosts(searchTerm = "", sortOrder = "new") {
  let posts = [...allPosts];

  // Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    posts = posts.filter((post) => {
      const title = (post.title || "").toLowerCase();
      const content = (post.content || "").toLowerCase();
      return title.includes(term) || content.includes(term);
    });
  }

  // Sort posts
  posts.sort((a, b) => {
    const dateA = a.date && a.date.toDate ? a.date.toDate() : new Date(0);
    const dateB = b.date && b.date.toDate ? b.date.toDate() : new Date(0);
    return sortOrder === "new" ? dateB - dateA : dateA - dateB;
  });

  if (posts.length === 0) {
    postsContainer.innerHTML =
      '<p class="text-center text-warm-brown/60 font-sans text-sm">No stories found.</p>';
    return;
  }

  let html = "";
  posts.forEach((post) => {
    console.log("Processing post:", post.id, post);
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
      content.length > 160 ? content.slice(0, 157) + "..." : content;
    const coverImageUrl = post.coverImageUrl;
    const slug = post.slug || post.id;
    html += `
      <article class="w-full flex flex-col items-center">
        <a class="w-full max-w-3xl group" href="story.html?slug=${slug}" data-slug="${slug}">
          <div class="bg-white/40 border border-warm-brown/5 rounded-2xl p-4 md:p-6 shadow-sm transition-all hover:shadow-md hover:bg-white/60">
            <div class="text-center mb-8">
              <h3 class="font-script text-4xl text-dark-brown mb-2">${title}</h3>
              <p class="font-sans text-[10px] uppercase tracking-[0.3em] text-burnt-orange font-semibold">${dateStr}</p>
            </div>
            ${
              coverImageUrl
                ? `<div class="mb-6 aspect-[7/5] overflow-hidden rounded-xl shadow"><img alt="${title}" class="w-full h-full object-cover" src="${coverImageUrl}" /></div>`
                : ""
            }
            <div class="max-w-2xl mx-auto text-center">
              <p class="text-lg leading-relaxed text-warm-brown/80 mb-4 italic">${preview}</p>
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
  console.log("Generated HTML length:", html.length);
  postsContainer.innerHTML = html;
  console.log("Posts rendered successfully");
}

// Search functionality
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value;
    const sortOrder = sortSelect ? sortSelect.value : "new";
    console.log("Search triggered:", searchTerm, "Sort:", sortOrder);
    renderPosts(searchTerm, sortOrder);
  });
}

// Sort functionality
if (sortSelect) {
  sortSelect.addEventListener("change", (e) => {
    const sortOrder = e.target.value;
    const searchTerm = searchInput ? searchInput.value : "";
    console.log("Sort changed to:", sortOrder, "Search:", searchTerm);
    renderPosts(searchTerm, sortOrder);
  });
}

console.log("About to fetch posts...");
fetchPosts();
