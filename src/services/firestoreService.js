// GCP Firestore Connection Service
// Configured for Firebase SDK v9+ (Modular)
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';

// Standard Firebase credentials - user can override using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
let app;
let db;
let isConnected = false;

try {
  // If keys are provided, attempt connection
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isConnected = true;
    console.log("Firebase/Firestore successfully initialized linking to GCP.");
  }
} catch (error) {
  console.warn("Failed to initialize Firebase Firestore. Operating in Mock mode.", error);
}

/**
 * Subscribes to telemetry updates for a specific machine document in Firestore.
 * @param {string} machineId ID of the machine (e.g. 'machine_alpha')
 * @param {function} onUpdate Callback function on receipt of new data
 * @returns {function} Unsubscribe function
 */
export function subscribeToMachineTelemetry(machineId, onUpdate) {
  if (!isConnected || !db) {
    console.log(`Firestore offline. Telemetry listener mocked for ${machineId}`);
    return () => {};
  }

  try {
    const docRef = doc(db, 'telemetry', machineId);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        onUpdate({ id: snapshot.id, ...snapshot.data() });
      }
    }, (error) => {
      console.error(`Firestore snapshot error for ${machineId}:`, error);
    });
  } catch (error) {
    console.error(`Error attaching listener to machine ${machineId}:`, error);
    return () => {};
  }
}

/**
 * Subscribes to the latest critical alarms from Firestore.
 * @param {function} onUpdate Callback on new alarms
 * @param {number} maxCount Maximum alarms to retrieve
 * @returns {function} Unsubscribe function
 */
export function subscribeToAlarms(onUpdate, maxCount = 20) {
  if (!isConnected || !db) {
    return () => {};
  }

  try {
    const colRef = collection(db, 'alarms');
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxCount));
    return onSnapshot(q, (snapshot) => {
      const alarms = [];
      snapshot.forEach((doc) => {
        alarms.push({ id: doc.id, ...doc.data() });
      });
      onUpdate(alarms);
    });
  } catch (error) {
    console.error('Error attaching alarms listener:', error);
    return () => {};
  }
}

export { db, isConnected };
