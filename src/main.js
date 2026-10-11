import { Client, Messaging } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    let body = req.bodyJson;

    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    log("FULL EVENT: " + JSON.stringify(body));

    if (!body) {
      throw new Error("Event body is missing");
    }

    const row = body;

    if (!row.USERID) {
      throw new Error(
        "USERID is missing from the database row. Event received: " +
        JSON.stringify(body)
      );
    }

    const userId = String(row.USERID);
    const confirm = String(row.CONFIRM ?? "");

    log("USERID: " + userId);
    log("CONFIRM: " + confirm);

    // Only send when CONFIRM = 2
    if (confirm !== "2") {
      return res.json({
        success: true,
        message: "Booking is not confirmed, no notification sent",
        confirm: confirm
      });
    }

    // Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const messaging = new Messaging(client);

    // Create push notification
    const result = await messaging.createPush({
      messageId: "booking-confirmed-" + Date.now(),
      title: "TravelLink",
      body: "Your booking has been confirmed.",
      targets: [userId]
    });

    log("PUSH RESULT: " + JSON.stringify(result));

    return res.json({
      success: true,
      message: "Notification sent",
      userId: userId,
      confirm: confirm,
      pushResult: result
    });

  } catch (e) {
    error("FUNCTION ERROR: " + e.message);

    return res.json({
      success: false,
      error: e.message
    });
  }
};
