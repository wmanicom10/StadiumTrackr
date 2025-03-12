const firebaseConfig = {
    apiKey: "AIzaSyB00UkZy97r0I7Wqv994VPGIhK4_73kzWc",
    authDomain: "stadiumtracker-88f95.firebaseapp.com",
    databaseURL: "https://stadiumtracker-88f95-default-rtdb.firebaseio.com",
    projectId: "stadiumtracker-88f95",
    storageBucket: "stadiumtracker-88f95.firebasestorage.app",
    messagingSenderId: "229185225017",
    appId: "1:229185225017:web:d02c682dd40e879e06a8e8"
  };
  
  const app = firebase.initializeApp(firebaseConfig);
  const database = firebase.database();