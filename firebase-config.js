const firebaseConfig = {
  apiKey: "AIzaSyBAbA6t2ApjhjjNdZt6sqILdZgSa2CnM9E",
  authDomain: "flutter-ai-playground-b9ec2.firebaseapp.com",
  projectId: "flutter-ai-playground-b9ec2",
  storageBucket: "flutter-ai-playground-b9ec2.firebasestorage.app",
  messagingSenderId: "855227196102",
  appId: "1:855227196102:web:8865c00ff64f6f2795edc7"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();