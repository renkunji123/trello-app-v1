import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Thông tin cấu hình của bạn
const firebaseConfig = {
  apiKey: "AIzaSyDatNko4guf2gOTGqZ7OU9dy4AO6-UGyPU",
  authDomain: "trello-64295.firebaseapp.com",
  projectId: "trello-64295",
  storageBucket: "trello-64295.firebasestorage.app",
  messagingSenderId: "1098084822568",
  appId: "1:1098084822568:web:e8bd9d588227eba0edcf1d"
};

// Khởi tạo Firebase và Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export biến 'db' để các file khác có thể sử dụng
export { db };