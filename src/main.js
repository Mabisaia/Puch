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

    // Check USERID
    if (row.USERID === undefined || row.USERID === null) {
      throw new Error(
        "USERID is missing from the database row. Event received: " +
        JSON.stringify(body)
      );
    }

    const userId = String(row.USERID).trim();
    const confirm = String(row.CONFIRM ?? "").trim();

    log("USERID: " + JSON.stringify(userId));
    log("USERID TYPE: " + typeof userId);
    log("CONFIRM: " + JSON.stringify(confirm));

    if (!userId) {
      throw new Error("USERID is empty");
    }

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

    log("Sending push to Appwrite Target ID: " + userId);

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
    error("FUNCTION ERROR: " + (e?.message || String(e)));

    return res.json({
      success: false,
      error: e?.message || String(e)
    });
  }
};
