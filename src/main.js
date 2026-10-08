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

    // Read the request body
    const body = JSON.parse(req.body || "{}");

    const deviceToken = body.deviceToken;
    const title = body.message?.title || "TravelLink South Sudan";
    const messageBody =
      body.message?.body || "You have a new notification.";

    // Check for device token
    if (!deviceToken) {
      return res.json(
        {
          success: false,
          message: "deviceToken is required",
        },
        400
      );
    }

    // Create FCM notification
    const message = {
      token: deviceToken,
      notification: {
        title: title,
        body: messageBody,
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
