import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, secondaryAuth } from "../firebase";

export const firebaseDBService = {
  // --- Orders ---
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
  },
  updateOrderStatus: async (orderId, newStatus) => {
      try {
          await updateDoc(doc(db, "orders", orderId), { status: newStatus });
          return true;
      } catch (error) {
          console.error("Error updating order status:", error);
          throw error;
      }
  },
  getOrdersByStatus: async (status) => {
    try {
      const q = query(collection(db, "orders"), where("status", "==", status));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching orders by status:", error);
      return [];
    }
  },
  getOrdersByDeliveryBoy: async (deliveryBoyId, status) => {
    try {
      const q = query(collection(db, "orders"), where("deliveryBoyId", "==", deliveryBoyId), where("status", "==", status));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching orders for delivery boy:", error);
      return [];
    }
  },
  assignOrderToDeliveryBoy: async (orderId, deliveryBoyId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { 
        deliveryBoyId: deliveryBoyId,
        status: 'IN_TRANSIT'
      });
      return true;
    } catch (error) {
      console.error("Error assigning order:", error);
      throw error;
    }
  },

  // --- Banners ---
  getBanners: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "systemBanners"));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching banners:", error);
      return [];
    }
  },
  addBanner: async (bannerData) => {
    try {
      const docRef = await addDoc(collection(db, "systemBanners"), {
        ...bannerData,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...bannerData };
    } catch (error) {
      console.error("Error adding banner:", error);
      throw error;
    }
  },
  deleteBanner: async (bannerId) => {
    try {
      await deleteDoc(doc(db, "systemBanners", bannerId));
      return true;
    } catch (error) {
      console.error("Error deleting banner:", error);
      throw error;
    }
  },

  // --- Users & Merchants ---
  getUsersByRole: async (role) => {
    try {
      const q = query(collection(db, "users"), where("role", "==", role));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error fetching users by role ${role}:`, error);
      return [];
    }
  },
  getAllMerchants: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "merchants"));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching merchants:", error);
      return [];
    }
  },
  addMerchantUser: async (userData, merchantData) => {
    try {
      // Create user in Auth using secondaryApp so current user doesn't get logged out
      const authResult = await createUserWithEmailAndPassword(secondaryAuth, userData.email, userData.password);
      const uid = authResult.user.uid;
      
      const { password, ...userMinusId } = userData;
      userMinusId.uid = uid;
      
      await setDoc(doc(db, "users", uid), userMinusId);
      
      merchantData.userId = uid;
      const merchRef = await addDoc(collection(db, "merchants"), merchantData);
      
      return { user: { id: uid, ...userMinusId }, merchant: { id: merchRef.id, ...merchantData } };
    } catch (error) {
      console.error("Error adding merchant user:", error);
      throw error;
    }
  },
  addDeliveryBoy: async (userData) => {
    try {
      const authResult = await createUserWithEmailAndPassword(secondaryAuth, userData.email, userData.password);
      const uid = authResult.user.uid;
      
      const { password, ...userMinusId } = userData;
      userMinusId.uid = uid;
      
      await setDoc(doc(db, "users", uid), userMinusId);
      return { id: uid, ...userMinusId };
    } catch (error) {
      console.error("Error adding delivery boy:", error);
      throw error;
    }
  },
  deleteUser: async (uid) => {
    try {
      await deleteDoc(doc(db, "users", uid));
      // Optionally clean up merchants if it was a merchant
      const q = query(collection(db, "merchants"), where("userId", "==", uid));
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
          await deleteDoc(doc(db, "merchants", d.id));
      });
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  // --- Offers ---
  getOffers: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "offers"));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching offers:", error);
      return [];
    }
  },
  addOffer: async (offerData) => {
    try {
      const docRef = await addDoc(collection(db, "offers"), {
        ...offerData,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...offerData };
    } catch (error) {
      console.error("Error adding offer:", error);
      throw error;
    }
  },
  deleteOffer: async (offerId) => {
    try {
      await deleteDoc(doc(db, "offers", offerId));
      return true;
    } catch (error) {
      console.error("Error deleting offer:", error);
      throw error;
    }
  },

  // --- Menu Items & Categories ---
  getMenuItems: async (merchantId) => {
      try {
        const q = query(collection(db, "menu_items"), where("merchantId", "==", merchantId));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error("Error fetching menu items:", error);
        return [];
      }
  },
  addMenuItem: async (itemData) => {
      try {
        const docRef = await addDoc(collection(db, "menu_items"), itemData);
        return { id: docRef.id, ...itemData };
      } catch (error) {
        console.error("Error adding menu item:", error);
        throw error;
      }
  },
  updateMenuItem: async (id, data) => {
      try {
          await updateDoc(doc(db, "menu_items", id), data);
          return true;
      } catch (error) {
          console.error("Error updating menu item:", error);
          throw error;
      }
  },
  deleteMenuItem: async (id) => {
      try {
          await deleteDoc(doc(db, "menu_items", id));
          return true;
      } catch (error) {
          console.error("Error deleting menu item:", error);
          throw error;
      }
  },
  getMerchantCategories: async (merchantId) => {
      try {
          const q = query(collection(db, "merchant_categories"), where("merchantId", "==", merchantId));
          const snap = await getDocs(q);
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
          console.error("Error fetching categories:", error);
          return [];
      }
  },
  addMerchantCategory: async (catData) => {
      try {
          const docRef = await addDoc(collection(db, "merchant_categories"), catData);
          return { id: docRef.id, ...catData };
      } catch (error) {
          console.error("Error adding category:", error);
          throw error;
      }
  },
  deleteMerchantCategory: async (id) => {
      try {
          await deleteDoc(doc(db, "merchant_categories", id));
          return true;
      } catch (error) {
          console.error("Error deleting category:", error);
          throw error;
      }
  }
};
