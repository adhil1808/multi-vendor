import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, setDoc, doc, addDoc } from 'firebase/firestore';
import { mockDB } from './mockDB.js';

const seedDatabase = async () => {
  console.log("Starting Database Seeding...");
  const oldToNewUserMap = {}; // Maps mockDB.users[i].id -> Firebase Auth UID
  
  // 1. Seed Users (and setup Auth)
  console.log("Seeding Users...");
  for (const user of mockDB.users) {
      try {
          const authResult = await createUserWithEmailAndPassword(auth, user.email, user.password);
          const newUid = authResult.user.uid;
          oldToNewUserMap[user.id] = newUid;
          
          const { id, password, ...userMinusId } = user;
          await setDoc(doc(db, "users", newUid), { ...userMinusId, uid: newUid });
          console.log(`Created user: ${user.name}`);
      } catch (err) {
          console.error(`Failed to create user ${user.email}: `, err.message);
      }
  }

  // 2. Seed Merchants
  console.log("Seeding Merchants...");
  for (const merchant of mockDB.merchants) {
      if(oldToNewUserMap[merchant.userId]) {
         const { id, ...merchData } = merchant;
         merchData.userId = oldToNewUserMap[merchant.userId];
         await addDoc(collection(db, "merchants"), merchData);
      }
  }

  // 3. Seed Menu Items
  console.log("Seeding Menu Items...");
  for (const item of mockDB.menu_items) {
      if(oldToNewUserMap[item.merchantId]) {
         const { id, ...itemData } = item;
         itemData.merchantId = oldToNewUserMap[item.merchantId];
         await addDoc(collection(db, "menu_items"), itemData);
      }
  }

  // 4. Seed Banners
  console.log("Seeding System Banners...");
  for (const banner of mockDB.systemBanners) {
      const { id, ...bannerData } = banner;
      await addDoc(collection(db, "systemBanners"), bannerData);
  }

  // 5. Seed Offers
  console.log("Seeding Offers...");
  for (const offer of mockDB.offers) {
      const { id, ...offerData } = offer;
      offerData.merchantId = offer.merchantId === 'ALL' ? 'ALL' : oldToNewUserMap[offer.merchantId];
      if(offerData.merchantId) {
          await addDoc(collection(db, "offers"), offerData);
      }
  }

  // 6. Seed Orders
  console.log("Seeding Historical Orders...");
  for (const order of mockDB.orders) {
      const { id, ...orderData } = order;
      if(orderData.customerId && oldToNewUserMap[orderData.customerId]) orderData.customerId = oldToNewUserMap[orderData.customerId];
      if(orderData.merchantId && oldToNewUserMap[orderData.merchantId]) orderData.merchantId = oldToNewUserMap[orderData.merchantId];
      if(orderData.deliveryBoyId && oldToNewUserMap[orderData.deliveryBoyId]) orderData.deliveryBoyId = oldToNewUserMap[orderData.deliveryBoyId];
      
      await addDoc(collection(db, "orders"), orderData);
  }

  console.log("🎉 Seeding Complete! You can now safely run the application on Firebase!");
  process.exit(0);
};

seedDatabase();
