export default async ({ req, res, log, error }) => {
  try {
    // 1. Read the Appwrite event
    let body = req.bodyJson;

    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    log("FULL EVENT: " + JSON.stringify(body));

    if (!body || typeof body !== "object") {
      throw new Error("Event body is missing or invalid");
    }

    // The event contains the database row directly
    const row = body;

    // 2. Get the target ID and confirmation status
    const targetId = String(row.USERID ?? "").trim();
    const confirm = String(row.CONFIRM ?? "").trim();

    log("TARGET ID: " + targetId);
    log("CONFIRM: " + confirm);

    if (!targetId) {
      throw new Error("USERID is missing from the database row");
    }

    // 3. Send notification only when CONFIRM = 2
    if (confirm !== "2") {
      return res.json({
        success: true,
        message: "Booking is not confirmed; no notification sent",
        confirm: confirm
      });
    }

    // 4. Read Appwrite environment variables
    const endpoint = process.env.APPWRITE_ENDPOINT;
    const projectId = process.env.APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;

    if (!endpoint || !projectId || !apiKey) {
      throw new Error(
        "Missing APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, or APPWRITE_API_KEY"
      );
    }

    // Support endpoints with or without /v1
    const cleanEndpoint = endpoint.replace(/\/+$/, "");
    const apiEndpoint = cleanEndpoint.endsWith("/v1")
      ? cleanEndpoint
      : cleanEndpoint + "/v1";

    // 5. Create the push notification through REST
    const messageId = "booking-confirmed-" + Date.now();

    const response = await fetch(
      apiEndpoint + "/messaging/messages/push",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Appwrite-Project": projectId,
          "X-Appwrite-Key": apiKey
        },
        body: JSON.stringify({
          messageId: messageId,
          title: "TravelLink",
          body: "Your booking has been confirmed.",
          targets: [targetId]
        })
      }
    );

    // 6. Read Appwrite's actual response
    const responseText = await response.text();

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      result = { rawResponse: responseText };
    }

    log("APPWRITE HTTP STATUS: " + response.status);
    log("APPWRITE PUSH RESPONSE: " + JSON.stringify(result));

    if (!response.ok) {
      throw new Error(
        "Appwrite Messaging HTTP " +
        response.status +
        ": " +
        (result.message || responseText)
      );
    }

    // 7. Return success
    return res.json({
      success: true,
      message: "Push notification request accepted by Appwrite",
      targetId: targetId,
      confirm: confirm,
      pushResult: result
    });

  } catch (e) {
    const message = e?.message || String(e);

    error("FUNCTION ERROR: " + message);

    return res.json({
      success: false,
      error: message
    });
  }
};
