import admin from "firebase-admin";

export default async ({ req, res, log, error }) => {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FCM_PROJECT_ID,
          clientEmail: process.env.FCM_CLIENT_EMAIL,
          privateKey: process.env.FCM_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    }

    const fcmToken = body.deviceToken;

    const messageId = await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: "TravelLink",
        body: "Your booking has been confirmed.",
      },
    });

    log(`Notification sent: ${messageId}`);

    return res.json({
      success: true,
      messageId: messageId,
    });

  } catch (err) {
    error(err);

    return res.json({
      success: false,
      error: err.message,
    });
  }
};
