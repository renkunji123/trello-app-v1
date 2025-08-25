// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDatNko4guf2gOTGqZ7OU9dy4AO6-UGyPU",
  authDomain: "trello-64295.firebaseapp.com",
  projectId: "trello-64295",
  storageBucket: "trello-64295.firebasestorage.app",
  messagingSenderId: "1098084822568",
  appId: "1:1098084822568:web:e8bd9d588227eba0edcf1d",
  measurementId: "G-JFMLTTYV19"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);