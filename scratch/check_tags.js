import { db } from './src/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

async function checkMerchants() {
  const snap = await getDocs(collection(db, "merchants"));
  snap.forEach(doc => {
    console.log(`Merchant: ${doc.data().restaurantName}, Tags: ${JSON.stringify(doc.data().tags)}`);
  });
}

checkMerchants();
