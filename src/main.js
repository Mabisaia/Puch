import { Client, Messaging, ID } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    // Get the event payload
    let body = req.bodyJson;

    // Safety: parse if Appwrite provides it as a string
    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    log("Event body: " + JSON.stringify(body));

    // Database row data
    const data = body?.data;

    if (!data) {
      return res.json({
        success: false,
        error: "Database row data is missing from the event"
      }, 400);
    }

    // USERID is your Appwrite push target ID
    const targetId = data?.USERID;

    if (!targetId) {
      return res.json({
        success: false,
        error: "USERID is missing from event.data"
      }, 400);
    }

    // Only send when CONFIRM is true
    if (data?.CONFIRM !== true) {
      log("CONFIRM is not true. No notification sent.");

      return res.json({
        success: true,
        message: "No notification required",
        confirm: data?.CONFIRM
      });
    }

    // Connect to Appwrite
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

    const messaging = new Messaging(client);

    // Send push notification to the registered target
    const message = await messaging.createPush({
      messageId: ID.unique(),
      title: "TravelLink",
      body: "Your booking has been confirmed.",
      targets: [targetId],
      priority: "high"
    });

    log("Push notification sent: " + JSON.stringify(message));

    return res.json({
      success: true,
      targetId: targetId,
      messageId: message.$id
    });

  } catch (err) {
    error("ERROR: " + err.message);

    return res.json({
      success: false,
      error: err.message
    }, 500);
  }
};
