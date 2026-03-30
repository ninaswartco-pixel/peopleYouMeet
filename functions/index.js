const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { Resend } = require("resend");

admin.initializeApp();
const db = admin.firestore();

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
