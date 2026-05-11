import { db } from '../src/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

async function checkMerchants() {
  try {
    const snap = await getDocs(collection(db, "merchants"));
    console.log("MERCHANTS_DATA_START");
    snap.forEach(doc => {
      console.log(JSON.stringify({ id: doc.id, ...doc.data() }));
    });
    console.log("MERCHANTS_DATA_END");
  } catch (err) {
    console.error("Error:", err);
  }
}

checkMerchants();
