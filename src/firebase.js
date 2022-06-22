// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app 's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBi-kWJ091WgznkX5WSfJZGo50Kmkfkp20",
  authDomain: "onespotapp-45841.firebaseapp.com",
  databaseURL: "https://onespotapp-45841-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "onespotapp-45841",
  storageBucket: "onespotapp-45841.appspot.com",
  messagingSenderId: "414345920391",
  appId: "1:414345920391:web:e8d3eb4fe6342135c35d22",
  measurementId: "G-R2ME43GQYD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export default db;
const analytics = getAnalytics(app);