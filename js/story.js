import { db } from "./firebase-init.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { hasLiked, addLike, removeLike, getSubscriberEmail } from "./likes.js";

// Utility to get URL parameters
const getUrlParameter = (name) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
};

const slug = getUrlParameter("slug");
const storyContainer = document.getElementById("storyContainer");
const notFoundMessage = document.getElementById("notFoundMessage");
const storyTitle = document.getElementById("storyTitle");
const storyDate = document.getElementById("storyDate");
const storyContent = document.getElementById("storyContent");
const imageCarousel = document.getElementById("imageCarousel");
const prevStory = document.getElementById("prevStory");
const nextStory = document.getElementById("nextStory");
const prevStoryTitle = document.getElementById("prevStoryTitle");
const nextStoryTitle = document.getElementById("nextStoryTitle");
const prevStoryContainer = document.getElementById("prevStoryContainer");
const nextStoryContainer = document.getElementById("nextStoryContainer");

const loadStory = async () => {
  const fetching = document.getElementById("fetchingMessage");
  if (!slug) {
    storyContainer.classList.add("hidden");
    notFoundMessage.classList.remove("hidden");
    if (fetching) fetching.style.display = "none";
    return;
  }

  try {
    const postsRef = collection(db, "posts");
    const q = query(
      postsRef,
      where("slug", "==", slug),
      where("published", "==", true),
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      storyContainer.classList.add("hidden");
      notFoundMessage.classList.remove("hidden");
      if (fetching) fetching.style.display = "none";
      return;
    }

    let storyDocId = null;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      storyDocId = docSnap.id;

      // Set title
      storyTitle.textContent = data.title;

      // Format date properly - Firestore Timestamp to readable date
      if (data.date && data.date.toDate) {
        const dateObj = data.date.toDate();
        const options = { year: "numeric", month: "long", day: "numeric" };
        const formattedDate = dateObj.toLocaleDateString("en-US", options);
        storyDate.textContent = formattedDate.toUpperCase();
      } else if (data.date) {
        // Fallback if date is a string
        const dateObj = new Date(data.date);
        const options = { year: "numeric", month: "long", day: "numeric" };
        const formattedDate = dateObj.toLocaleDateString("en-US", options);
        storyDate.textContent = formattedDate.toUpperCase();
      } else {
        storyDate.textContent = "DATE UNAVAILABLE";
      }

      // Apply text alignment
      const align = data.textAlign || "center";
      storyContent.style.textAlign = align;

      // Set content — render HTML from old posts, convert newlines for plain-text posts
      const raw = data.content || "";
      const hasHtml = /<[a-z][\s\S]*>/i.test(raw);
      const formatted = hasHtml
        ? raw
        : raw.replace(/\n/g, "<br>");
      storyContent.innerHTML = `<div class="text-xl leading-relaxed text-warm-brown/80">${formatted}</div>`;

      // Handle cover image
      if (data.coverImageUrl) {
        imageCarousel.innerHTML = `
          <div class="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory rounded-xl shadow-lg">
            <div class="min-w-full aspect-[7/5] overflow-hidden snap-center">
              <img
                alt="${data.title}"
                class="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                src="${data.coverImageUrl}"
              />
            </div>
          </div>
        `;
      }
    });

    // Like button handler
    const likeBtn = document.getElementById("storyLikeBtn");
    if (likeBtn && storyDocId) {
      const liked = hasLiked(storyDocId);
      const svg = likeBtn.querySelector("svg");
      if (liked) {
        likeBtn.style.color = "#ef4444";
        svg.setAttribute("fill", "currentColor");
      }

      likeBtn.addEventListener("click", async () => {
        if (hasLiked(storyDocId)) {
          await removeLike(storyDocId);
          likeBtn.style.color = "rgba(92,64,51,0.3)";
          svg.setAttribute("fill", "none");
          return;
        }

        if (getSubscriberEmail()) {
          await addLike(storyDocId);
          likeBtn.style.color = "#ef4444";
          svg.setAttribute("fill", "currentColor");
          return;
        }

        // Not a subscriber — show name prompt
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
          await addLike(storyDocId, name);
          likeBtn.style.color = "#ef4444";
          svg.setAttribute("fill", "currentColor");
        };

        prompt.querySelector(".like-prompt-submit").addEventListener("click", () => doLike(input.value.trim() || "Anonymous"));
        input.addEventListener("keydown", (e) => { if (e.key === "Enter") doLike(input.value.trim() || "Anonymous"); });
        prompt.querySelector(".like-prompt-anon").addEventListener("click", () => doLike("Anonymous"));
        prompt.addEventListener("click", (e) => { if (e.target === prompt) prompt.remove(); });
      });
    }

    // Share button handler
    const shareBtn = document.getElementById("storyShareBtn");
    if (shareBtn) {
      shareBtn.addEventListener("click", () => {
        document.querySelectorAll(".share-menu").forEach((m) => m.remove());

        const url = window.location.href;
        const title = storyTitle.textContent;

        const menu = document.createElement("div");
        menu.className = "share-menu";
        menu.style.cssText = "position:absolute;top:100%;right:0;background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:10px;padding:6px 0;box-shadow:0 4px 16px rgba(0,0,0,0.08);z-index:50;min-width:150px;font-family:sans-serif;font-size:13px;";

        const copyItem = document.createElement("button");
        copyItem.textContent = "Copy link";
        copyItem.style.cssText = "display:flex;align-items:center;gap:8px;width:100%;padding:8px 14px;border:none;background:none;cursor:pointer;color:#5a4a3a;text-align:left;";
        copyItem.onmouseenter = () => copyItem.style.background = "rgba(0,0,0,0.04)";
        copyItem.onmouseleave = () => copyItem.style.background = "none";
        copyItem.addEventListener("click", async (ev) => {
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
            ev.stopPropagation();
            try { await navigator.share({ title, url }); } catch {}
            menu.remove();
          });
          menu.appendChild(shareItem);
        }

        const rect = shareBtn.getBoundingClientRect();
        menu.style.position = "fixed";
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.right = `${window.innerWidth - rect.right}px`;
        document.body.appendChild(menu);

        const closeMenu = (ev) => {
          if (!menu.contains(ev.target) && ev.target !== shareBtn) {
            menu.remove();
            document.removeEventListener("click", closeMenu);
          }
        };
        setTimeout(() => document.addEventListener("click", closeMenu), 0);
      });
    }

    if (fetching) fetching.style.display = "none";
    loadNavigation();
  } catch (error) {
    console.error("Error loading story:", error);
    storyContainer.classList.add("hidden");
    notFoundMessage.classList.remove("hidden");
    if (fetching) fetching.style.display = "none";
  }
};

const loadNavigation = async () => {
  try {
    const postsRef = collection(db, "posts");
    // Query only for published posts, then sort in JavaScript to avoid index requirement
    const q = query(postsRef, where("published", "==", true));
    const querySnapshot = await getDocs(q);

    const posts = [];
    querySnapshot.forEach((doc) => {
      posts.push(doc.data());
    });

    // Sort posts by date in ascending order
    posts.sort((a, b) => {
      const dateA =
        a.date && a.date.toDate ? a.date.toDate() : new Date(a.date);
      const dateB =
        b.date && b.date.toDate ? b.date.toDate() : new Date(b.date);
      return dateA - dateB;
    });

    console.log("All posts:", posts);
    console.log("Current slug:", slug);

    const currentIndex = posts.findIndex((post) => post.slug === slug);
    console.log("Current index:", currentIndex);

    if (currentIndex > 0) {
      const prevPost = posts[currentIndex - 1];
      console.log("Previous post:", prevPost);
      prevStory.href = `story.html?slug=${prevPost.slug}`;
      if (prevStoryTitle) {
        prevStoryTitle.textContent = prevPost.title;
      }
      prevStoryContainer.style.display = "block";
    } else {
      prevStoryContainer.style.display = "none";
    }

    if (currentIndex >= 0 && currentIndex < posts.length - 1) {
      const nextPost = posts[currentIndex + 1];
      console.log("Next post:", nextPost);
      nextStory.href = `story.html?slug=${nextPost.slug}`;
      if (nextStoryTitle) {
        nextStoryTitle.textContent = nextPost.title;
      }
      nextStoryContainer.style.display = "block";
    } else {
      nextStoryContainer.style.display = "none";
    }
  } catch (error) {
    console.error("Error loading navigation:", error);
  }
};

loadStory();
