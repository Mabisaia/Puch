import admin from "firebase-admin";

export default async ({ req, res, log, error }) => {
  try {
    if (!admin.apps.length) {
      const projectId = process.env.FCM_PROJECT_ID;
      const clientEmail = process.env.FCM_CLIENT_EMAIL;
      const privateKey = process.env.FCM_PRIVATE_KEY;

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
          "Missing FCM_PROJECT_ID, FCM_CLIENT_EMAIL, or FCM_PRIVATE_KEY"
        );
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
    }

    const body = req.bodyJson || {};

    const deviceToken = body.deviceToken;
    const title = body.title || "TravelLink South Sudan";
    const messageBody =
      body.body || "You have a new notification.";

    if (!deviceToken) {
      return res.json(
        {
          success: false,
          error: "deviceToken is required",
        },
        400
      );
    }

    const message = {
      token: deviceToken,
      notification: {
        title,
        body: messageBody,
      },
      data: {
        type: String(body.type || "test"),
      },
    };

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
