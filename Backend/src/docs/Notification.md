Perfect choice ✅ — using Firebase Admin SDK gives you full control over notifications (great for production apps like RescueNect).
Even if your app is built with Expo, you can still use Admin SDK on your Node.js backend — it directly talks to Firebase Cloud Messaging (FCM) servers.

Let’s set it up step-by-step 👇

🧩 Step 1: Install Firebase Admin SDK

In your backend folder:

npm install firebase-admin express

🧩 Step 2: Create a Firebase service account

Go to your Firebase console → Project Settings → Service Accounts

Click “Generate new private key”

Save it as serviceAccountKey.json in your backend folder

🧩 Step 3: Initialize Firebase in your backend

Here’s a ready-to-run Express server using Admin SDK:

``` javascript
import express from "express";
import admin from "firebase-admin";
import fs from "fs";

const app = express();
app.use(express.json());

// Load service account
const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Send notification endpoint
app.post("/send-notification", async (req, res) => {
  try {
    const { token, title, body, data } = req.body;

    const message = {
      notification: {
        title: title || "Default Title",
        body: body || "Default Message",
      },
      data: data || {}, // optional: to pass screen info, etc.
      token, // this is the device FCM token
    };

    const response = await admin.messaging().send(message);
    res.json({ success: true, messageId: response });
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => console.log("🚀 Server running at http://localhost:3000"));
```
### 🧩 Step 4: Get your device FCM token (Expo app)

You’ll need to link Expo with FCM manually.
In your React Native (Expo) app:

``` javascript
import messaging from "@react-native-firebase/messaging";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    const getToken = async () => {
      await messaging().requestPermission();
      const token = await messaging().getToken();
      console.log("📱 FCM Token:", token);
    };

    getToken();
  }, []);

  return null;
}
```

➡️ This gives you a real FCM token (not Expo token).
That’s the one your backend will use in /send-notification.

### 🧩 Step 5: Send notification (Postman example)


POST → http://localhost:3000/send-notification

``` JSON
{
  "token": "YOUR_DEVICE_FCM_TOKEN",
  "title": "Weather Alert 🌧️",
  "body": "Flood warning in your area!",
  "data": {
    "screen": "WeatherScreen",
    "alertType": "Flood"
  }
}
```

✅ Summary

Backend: uses Firebase Admin SDK (direct FCM access).

Mobile: must use @react-native-firebase/messaging (to get real FCM token).

Notifications are sent directly from your server to FCM → to your device.

You can pass data payload (like screen = "WeatherScreen") to navigate users when tapped.