import admin from "firebase-admin";

export default async ({ req, res, log, error }) => {
  try {
    // Initialize Firebase Admin only once
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FCM_PROJECT_ID,
          clientEmail: process.env.FCM_CLIENT_EMAIL,
          privateKey: process.env.FCM_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    }

    // Appwrite already provides the parsed JSON object
    const body = req.bodyJson || {};

    const deviceToken = body.deviceToken;
    const title = body.title || "TravelLink South Sudan";
    const messageBody =
      body.body || "You have a new notification.";

    // Check for device token
    if (!deviceToken) {
      return res.json(
        {
          success: false,
          error: "deviceToken is required",
        },
        400
      );
    }

    // Create FCM message
    const message = {
      token: deviceToken,
      notification: {
        title: title,
        body: messageBody,
      },
      data: {
        type: String(body.type || "test"),
      },
    };

    // Send notification
    const response = await admin.messaging().send(message);

    log("FCM message sent: " + response);

    return res.json({
      success: true,
      messageId: response,
    });

  } catch (err) {
    error("FCM error: " + err.message);

    return res.json(
      {
        success: false,
        error: err.message,
      },
      500
    );
  }
};
