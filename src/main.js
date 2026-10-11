import { Client, Messaging } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    let body = req.bodyJson;

    // Appwrite may provide the body as a string
    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    log("FULL EVENT: " + JSON.stringify(body));

    // Your Appwrite event IS the database row
    const row = body;

    if (!row || !row.USERID) {
      throw new Error(
        "Database row data or USERID is missing from the event. Event received: " +
        JSON.stringify(body)
      );
    }

    log("ROW DATA: " + JSON.stringify(row));

    const userId = row.USERID;
    const confirm = String(row.CONFIRM);

    log("USERID: " + userId);
    log("CONFIRM: " + confirm);

    // CONFIRM = 2 means booking confirmed
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

    // Send push notification to the Appwrite user target
    const result = await messaging.createPush(
      "default",
      "TravelLink",
      "Your booking has been confirmed.",
      [],
      [],
      [userId]
    );

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
