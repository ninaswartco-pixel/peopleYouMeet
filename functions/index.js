const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { randomUUID } = require("crypto");
const { defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { Resend } = require("resend");

admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// Set your Resend API key as a Firebase secret/config:
//   firebase functions:secrets:set RESEND_API_KEY
const resendApiKey = defineString("RESEND_API_KEY");

// Your site URL (change to your production domain)
const SITE_URL = "https://www.blueoceandomain.co.za/peopleYouMeet";

// Send notification email to all subscribers
async function notifySubscribers(postData) {
  const resend = new Resend(resendApiKey.value());

  // Get all subscribers
  const subscribersSnap = await db.collection("subscribers").get();
  if (subscribersSnap.empty) {
    console.log("No subscribers to notify.");
    return;
  }

  const subscribers = [];
  subscribersSnap.forEach((doc) => {
    subscribers.push(doc.data());
  });

  const storyUrl = `${SITE_URL}/story.html?slug=${postData.slug}`;

  // Send individual emails (so each has their own unsubscribe link)
  const promises = subscribers.map((sub) => {
    const unsubscribeUrl = `${SITE_URL}/unsubscribe.html?token=${sub.token}`;

    console.log(`Sending email to: ${sub.email}`);
    return resend.emails.send({
      from: "The People You Meet <noreply@blueoceandomain.co.za>",
      to: sub.email,
      subject: `New Story: ${postData.title}`,
      html: `
        <div style="font-family: 'Georgia', serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; color: #5C4033;">
          <h1 style="font-family: serif; font-size: 28px; color: #BF5700; margin-bottom: 8px; text-align: center;">
            The People You Meet
          </h1>
          <p style="text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #5C4033; opacity: 0.5; margin-bottom: 32px;">
            A new story by Carla
          </p>
          <hr style="border: none; border-top: 1px solid #5C4033; opacity: 0.15; margin-bottom: 32px;" />
          <h2 style="font-size: 22px; margin-bottom: 12px; text-align: center;">${postData.title}</h2>
          ${postData.coverImageUrl ? `
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${postData.coverImageUrl}" alt="${postData.title}" style="max-width: 100%; height: auto; border-radius: 12px;" />
          </div>
          ` : ""}
          <p style="font-size: 15px; line-height: 1.7; color: #5C4033; opacity: 0.8; text-align: center; margin-bottom: 28px;">
            Carla has shared a new story. Click below to read it.
          </p>
          <div style="text-align: center; margin-bottom: 40px;">
            <a href="${storyUrl}" style="display: inline-block; background: #BF5700; color: #fff; text-decoration: none; padding: 12px 32px; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; border-radius: 24px;">
              Read the Story
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #5C4033; opacity: 0.1; margin-bottom: 16px;" />
          <p style="text-align: center; font-size: 11px; color: #5C4033; opacity: 0.4;">
            <a href="${unsubscribeUrl}" style="color: #5C4033; opacity: 0.6;">Unsubscribe</a>
          </p>
        </div>
      `,
    }).then((result) => {
      console.log(`Email result for ${sub.email}:`, JSON.stringify(result));
    }).catch((err) => {
      console.error(`Failed to send to ${sub.email}:`, JSON.stringify(err));
    });
  });

  await Promise.all(promises);
  console.log(`Notified ${subscribers.length} subscribers about: ${postData.title}`);
}

// Welcome email when someone subscribes
exports.onNewSubscriber = onDocumentCreated("subscribers/{subId}", async (event) => {
  const sub = event.data.data();
  const resend = new Resend(resendApiKey.value());
  const unsubscribeUrl = `${SITE_URL}/unsubscribe.html?token=${sub.token}`;
  const entriesUrl = `${SITE_URL}/entries.html`;

  console.log(`Sending welcome email to: ${sub.email}`);
  try {
    const result = await resend.emails.send({
      from: "The People You Meet <noreply@blueoceandomain.co.za>",
      to: sub.email,
      subject: "Welcome to The People You Meet",
      html: `
        <div style="font-family: 'Georgia', serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; color: #5C4033;">
          <h1 style="font-family: serif; font-size: 28px; color: #BF5700; margin-bottom: 8px; text-align: center;">
            The People You Meet
          </h1>
          <p style="text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #5C4033; opacity: 0.5; margin-bottom: 32px;">
            Welcome
          </p>
          <hr style="border: none; border-top: 1px solid #5C4033; opacity: 0.15; margin-bottom: 32px;" />
          <h2 style="font-size: 22px; margin-bottom: 16px; text-align: center;">So glad to have you here!</h2>
          <p style="font-size: 15px; line-height: 1.7; color: #5C4033; opacity: 0.8; text-align: center; margin-bottom: 28px;">
            You'll be notified every time Carla shares a new story about the beautiful people she meets along the way.
          </p>
          <div style="text-align: center; margin-bottom: 40px;">
            <a href="${entriesUrl}" style="display: inline-block; background: #BF5700; color: #fff; text-decoration: none; padding: 12px 32px; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; border-radius: 24px;">
              Read the Stories
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #5C4033; opacity: 0.1; margin-bottom: 16px;" />
          <p style="text-align: center; font-size: 11px; color: #5C4033; opacity: 0.4;">
            <a href="${unsubscribeUrl}" style="color: #5C4033; opacity: 0.6;">Unsubscribe</a>
          </p>
        </div>
      `,
    });
    console.log(`Welcome email result for ${sub.email}:`, JSON.stringify(result));
  } catch (err) {
    console.error(`Failed to send welcome to ${sub.email}:`, JSON.stringify(err));
  }
});

// Trigger on NEW post created
exports.onPostCreated = onDocumentCreated("posts/{postId}", async (event) => {
  const data = event.data.data();
  if (data.published) {
    await notifySubscribers(data);
  }
});

// Trigger on post UPDATED (e.g. draft → published)
exports.onPostUpdated = onDocumentUpdated("posts/{postId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Only notify if post just became published (was not published before)
  if (!before.published && after.published) {
    await notifySubscribers(after);
  }
});

// ---------------------------------------------------------------------------
// Callable functions: the browser calls these instead of touching the
// subscribers or likes collections directly. Firestore rules block the browser
// from reading or writing subscribers, so these run with admin rights.
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isShortText(value, max) {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

// Subscribe an email (duplicate check happens here, on the server)
exports.subscribe = onCall(async (request) => {
  const email = cleanEmail(request.data && request.data.email);
  if (!EMAIL_RE.test(email) || email.length > 200) {
    throw new HttpsError("invalid-argument", "Please enter a valid email address.");
  }

  const existing = await db.collection("subscribers").where("email", "==", email).limit(1).get();
  if (!existing.empty) {
    return { success: false, message: "You're already subscribed!" };
  }

  await db.collection("subscribers").add({
    email,
    token: randomUUID(),
    subscribedAt: FieldValue.serverTimestamp(),
  });
  return { success: true, message: "You're subscribed! You'll be notified when Carla posts." };
});

// Unsubscribe using the token from the email link
exports.unsubscribeByToken = onCall(async (request) => {
  const token = request.data && request.data.token;
  if (!isShortText(token, 100)) {
    return { success: false, message: "Subscription not found or already removed." };
  }

  const snapshot = await db.collection("subscribers").where("token", "==", token).get();
  if (snapshot.empty) {
    return { success: false, message: "Subscription not found or already removed." };
  }
  await Promise.all(snapshot.docs.map((d) => d.ref.delete()));
  return { success: true, message: "You've been unsubscribed. You won't receive further emails." };
});

// Unsubscribe using the email address typed into the site
exports.unsubscribeByEmail = onCall(async (request) => {
  const email = cleanEmail(request.data && request.data.email);
  if (!EMAIL_RE.test(email) || email.length > 200) {
    throw new HttpsError("invalid-argument", "Please enter a valid email address.");
  }

  const snapshot = await db.collection("subscribers").where("email", "==", email).get();
  if (snapshot.empty) {
    return { success: false, message: "This email is not subscribed." };
  }
  await Promise.all(snapshot.docs.map((d) => d.ref.delete()));
  return { success: true, message: "You've been unsubscribed successfully." };
});

// Like a post. Subscribers are identified by their email (checked against the
// subscribers list here); everyone else gives a name or stays "Anonymous".
exports.likePost = onCall(async (request) => {
  const data = request.data || {};
  if (!isShortText(data.postId, 200) || !isShortText(data.localId, 100)) {
    throw new HttpsError("invalid-argument", "Missing post or visitor id.");
  }

  const postSnap = await db.collection("posts").doc(data.postId).get();
  if (!postSnap.exists) {
    throw new HttpsError("not-found", "This story could not be found.");
  }

  const likesRef = db.collection("posts").doc(data.postId).collection("likes");
  const already = await likesRef.where("localId", "==", data.localId).limit(1).get();
  if (!already.empty) {
    return { liked: true };
  }

  const email = cleanEmail(data.email);
  let isSubscriber = false;
  if (EMAIL_RE.test(email)) {
    const sub = await db.collection("subscribers").where("email", "==", email).limit(1).get();
    isSubscriber = !sub.empty;
  }

  const typedName = typeof data.name === "string" ? data.name.trim().slice(0, 100) : "";
  const likeData = {
    localId: data.localId,
    name: isSubscriber ? email : typedName || "Anonymous",
    isSubscriber,
    likedAt: FieldValue.serverTimestamp(),
  };
  if (isSubscriber) likeData.email = email;

  await likesRef.add(likeData);
  return { liked: true };
});

// Remove this visitor's like from a post
exports.unlikePost = onCall(async (request) => {
  const data = request.data || {};
  if (!isShortText(data.postId, 200) || !isShortText(data.localId, 100)) {
    throw new HttpsError("invalid-argument", "Missing post or visitor id.");
  }

  const likesRef = db.collection("posts").doc(data.postId).collection("likes");
  const snap = await likesRef.where("localId", "==", data.localId).get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
  return { liked: false };
});
