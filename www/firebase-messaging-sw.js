// www/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// FIREBASE CONSOLE -> PROJECT SETTINGS
const firebaseConfig = {
  apiKey: "AIzaSyD-JSK9q44X3He8-kmoszTX6VwlGpg5_N8",
  authDomain: "bsac-schedule-ft.firebaseapp.com",
  projectId: "bsac-schedule-ft",
  storageBucket: "bsac-schedule-ft.appspot.com",
  messagingSenderId: "937992829672",
  appId: "1:937992829672:android:087feba164f0e5bb22675d"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Гэтая функцыя спрацоўвае, калі прыкладанне закрыта
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'logo.png' // Пераканайся, што гэты файл ёсць побач
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});