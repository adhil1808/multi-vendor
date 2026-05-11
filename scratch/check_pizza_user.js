import { db } from '../src/firebase.js';
import { doc, getDoc } from 'firebase/firestore';

async function checkUser() {
  try {
    const uid = "3Tl5FR6dnmeq7g1YIPxmoeMymZ42";
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      console.log("USER_DATA:", JSON.stringify(docSnap.data()));
    } else {
      console.log("USER_NOT_FOUND");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

checkUser();
