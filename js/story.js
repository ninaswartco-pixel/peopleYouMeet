import { db } from "./firebase-init.js";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

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
  if (!slug) {
    storyContainer.classList.add("hidden");
    notFoundMessage.classList.remove("hidden");
    return;
  }

  try {
    const postsRef = collection(db, "posts");
    const q = query(
      postsRef,
      where("slug", "==", slug),
      where("published", "==", true)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      storyContainer.classList.add("hidden");
      notFoundMessage.classList.remove("hidden");
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();

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

      // Set content
      storyContent.innerHTML = `<p class="text-xl leading-relaxed text-warm-brown/80">${data.content}</p>`;

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

    loadNavigation();
  } catch (error) {
    console.error("Error loading story:", error);
    storyContainer.classList.add("hidden");
    notFoundMessage.classList.remove("hidden");
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
