// js/login-modal.js
// Controls the login modal and handles Firebase Auth (modular v10+)
// Assumes firebase-init.js exports 'auth' from Firebase v10+ modular SDK

import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from "./firebase-init.js";

const modal = document.getElementById("login-modal");
const openBtn = document.querySelector(".secret-author");
const closeBtn = document.getElementById("login-modal-close");
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const messageArea = document.getElementById("login-message");

function showModal() {
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  messageArea.textContent = "";
  emailInput.value = "";
  passwordInput.value = "";
}

function hideModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

if (openBtn) {
  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showModal();
  });
}
if (closeBtn) {
  closeBtn.addEventListener("click", hideModal);
}
modal.addEventListener("click", (e) => {
  if (e.target === modal) hideModal();
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  messageArea.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) {
    messageArea.textContent = "Please enter both email and password.";
    return;
  }
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    console.log("Logged in UID:", user.uid);
    hideModal();
    window.location.href = "admin.html";
  } catch (error) {
    let msg = "Login failed. Please try again.";
    if (error.code === "auth/wrong-password") msg = "Incorrect password.";
    else if (error.code === "auth/user-not-found")
      msg = "No user found with this email.";
    else if (error.code === "auth/invalid-email")
      msg = "Invalid email address.";
    else if (error.code === "auth/invalid-credential")
      msg = "Invalid credentials.";
    messageArea.textContent = msg;
  }
});
