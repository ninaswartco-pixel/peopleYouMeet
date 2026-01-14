// --- HERO IMAGE REPLACEMENT LOGIC ---
// Allows admin to change the hero image on the homepage
const setupHeroImageReplace = () => {
  // Find the Replace Hero Image element
  const replaceHeroBtn = document.querySelector(
    'span:contains("Replace Hero Image")'
  );
  if (!replaceHeroBtn) return;

  // Create a hidden file input for image upload
  let fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  replaceHeroBtn.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      // Save the image data to localStorage (for demo purposes)
      localStorage.setItem("heroImage", ev.target.result);
      // Optionally, show a preview or notify user
      alert("Hero image updated!");
    };
    reader.readAsDataURL(file);
  });
};

// --- GLOBAL NAVIGATION & UTILITIES ---

// 1. Image Carousel Logic (For the 7:5 ratio cards)
// This allows clicking or swiping to navigate photos in a post
const scrollPhotos = (direction, containerId) => {
  const container = document.getElementById(containerId);
  const scrollAmount = container.clientWidth;
  container.scrollBy({
    left: direction === "next" ? scrollAmount : -scrollAmount,
    behavior: "smooth",
  });
};

// 2. Search Functionality (For the Edit Stories list)
const setupSearch = () => {
  const searchInput = document.getElementById("storySearch");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const stories = document.querySelectorAll(".story-row"); // Assuming each row has this class

    stories.forEach((story) => {
      const title = story.querySelector(".story-title").innerText.toLowerCase();
      story.style.display = title.includes(term) ? "flex" : "none";
    });
  });
};

// --- ADMIN PAGE LOGIC ---

// 3. Logout Modal Toggle
const setupLogoutModal = () => {
  const logoutBtn = document.getElementById("logoutBtn");
  const modal = document.getElementById("logoutModal");
  const cancelBtn = document.getElementById("cancelLogout");

  if (logoutBtn && modal) {
    logoutBtn.addEventListener("click", () => {
      modal.style.display = "flex"; // Show modal
    });

    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none"; // Hide modal
    });

    // Close if clicking outside the white card
    window.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  }
};

// 4. "Write New Story" Template Toggle
// This simulates clicking the big button to show the card editor
const setupAdminToggles = () => {
  const newStoryBtn = document.getElementById("writeNewBtn");
  const editorSection = document.getElementById("storyEditor");

  if (newStoryBtn && editorSection) {
    newStoryBtn.addEventListener("click", () => {
      editorSection.scrollIntoView({ behavior: "smooth" });
      // In a real app, this would also clear the form fields
    });
  }
};

// --- INITIALIZE ON LOAD ---
document.addEventListener("DOMContentLoaded", () => {
  setupLogoutModal();
  setupSearch();
  setupAdminToggles();
  setupHeroImageReplace();
});
