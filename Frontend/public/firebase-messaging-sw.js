// Must be in your public/ directory (root of your web app)
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Reinitialize Firebase here
firebase.initializeApp({
  apiKey: 'AIzaSyDXR-C63KYDKQrBmGBixtpMXLtxr-BM_H8',
  authDomain: 'lively-metrics-453114-q3.firebaseapp.com',
  projectId: 'lively-metrics-453114-q3',
  messagingSenderId: '554379793893',
  appId: '1:554379793893:web:801b1a518994618ef4cb0c',
  measurementId: 'G-TNF4575E7Y',
});

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(payload => {
  console.log('📩 Background message received:', payload);

  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'Notification', {
    body: body || '',
    icon: '/icons/icon-192x192.png', // optional
  });
});
