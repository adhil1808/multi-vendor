import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// This file mimics the dbService structure in mockDB.js, allowing you to quickly swap imports 
// from '../mockDB' to '../services/firebaseDB' once your Database is up and running.

export const firebaseDBService = {
  getOrdersForMerchant: async (merchantId) => {
    try {
      const q = query(collection(db, "orders"), where("merchantId", "==", merchantId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching merchant orders:", error);
      return [];
    }
  },

  getOrdersForCustomer: async (customerId) => {
    try {
      const q = query(collection(db, "orders"), where("customerId", "==", customerId));
      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return orders.sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      return [];
    }
  },

  getAllOrders: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching all orders:", error);
      return [];
    }
  },

  placeOrder: async (orderData) => {
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        ...orderData,
        status: 'PENDING',
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...orderData, status: 'PENDING' };
    } catch (error) {
      console.error("Error placing order:", error);
      throw error;
    }
  }
};
