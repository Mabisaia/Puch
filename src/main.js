import { Client, Databases, Messaging } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    let body = req.bodyJson;

    // Appwrite may provide the body as a string
    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    log("FULL EVENT: " + JSON.stringify(body));

    // Get the database row from the event
    const row =
      body?.data ||
      body?.payload ||
      body?.row ||
      body?.data?.row;

    if (!row) {
      throw new Error(
        "Database row data is missing from the event. Event received: " +
        JSON.stringify(body)
      );
    }

    log("ROW DATA: " + JSON.stringify(row));

    // Get your columns
    const userId = row.USERID;
    const confirm = row.CONFIRM;

    if (!userId) {
      throw new Error("USERID is missing from the database row");
    }

    log("USERID: " + userId);
    log("CONFIRM: " + confirm);

    // Only send notification when CONFIRM is true
    if (confirm !== true && confirm !== "true" && confirm !== 1) {
      return res.json({
        success: true,
        message: "CONFIRM is not true, no notification sent"
      });
    }

    // Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const messaging = new Messaging(client);

    // Send push notification using the Appwrite target/user ID
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
      userId: userId
    });

  } catch (e) {
    error(e.message);

    return res.json({
      success: false,
      error: e.message
    });
  }
};
