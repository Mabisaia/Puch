import admin from "firebase-admin";

export default async ({ req, res, log, error }) => {
  try {
    log("REQUEST BODY: " + JSON.stringify(req.bodyJson));
    log("REQUEST HEADERS: " + JSON.stringify(req.headers));

    return res.json({
      success: true,
      received: req.bodyJson || null
    });

  } catch (err) {
    error("Error: " + err.message);

    return res.json({
      success: false,
      error: err.message
    }, 500);
  }
};
