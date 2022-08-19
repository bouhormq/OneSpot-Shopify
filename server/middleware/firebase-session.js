import db from "../../src/firebase.js";
import {   doc, setDoc, getDoc,deleteDoc, connectFirestoreEmulator } from "firebase/firestore"; 
import { Session } from "@shopify/shopify-api/dist/auth/session/session.js";


class FirebaseSessionHandler {
   storeCallback = async (session) => {
    console.log(
      `Custom session storage storeCallback fired with id [${session.id}]`
    );
    let appSessionsRef = doc(db, 'app-sessions', session.id);
    try {
        setDoc(appSessionsRef, JSON.parse(JSON.stringify(session)), { merge: true });
      return true;
    } catch (err) {
      throw new Error(err);
    }
  };
  
  /*
    The loadCallback takes in the id, and tries to retrieve the session data from Firestore
    If a stored session exists, it's returned
    Otherwise, return undefined
    */
   loadCallback = async (id) => {
    console.log(`Custom session storage loadCallback fired with id [${id}]`);

    const startsWith = new RegExp('^offline_');
    const endsWith = new RegExp('.com$');
    let appSessionsRef = id;
    let docRef;
    if (startsWith.test(id) && endsWith.test(id)){
      docRef = doc(db, 'app-sessions', appSessionsRef);
    }
    else{
      appSessionsRef = "offline_" + appSessionsRef;
      appSessionsRef = appSessionsRef.replace(/\d+$/, "");
      appSessionsRef = appSessionsRef.slice(0, -1);
      docRef = doc(db, 'app-sessions', appSessionsRef);
    }
    try {
      const sessionSnapshot =  await getDoc(docRef);
      if (!sessionSnapshot.exists) {
        console.log(`Custom session storage session id [${appSessionsRef}] does not exist`);
        return undefined;
      }
      const session = sessionSnapshot.data();
      if (!session) {
        console.log(`Custom session storage session id [${id}] no data`);
        return undefined;
      }
      return Session.cloneSession(session, session.id);
    } catch (err) {
      throw new Error(err);
    }
  };
  
  /*
      The deleteCallback takes in the id, and attempts to delete the session from Firestore
      If the session can be deleted, return true,
      otherwise, return false
    */
   deleteCallback = async (id) => {
    console.log(`Custom session storage deleteCallback fired with id [${id}]`);
    let appSessionsRef = doc(db, 'app-sessions', id);
    try {
      const sessionSnapshot = await getDoc(appSessionsRef);
      if (!sessionSnapshot.exists) {
        console.log(`Custom session storage session id [${id}] does not exist`);
        return false;
      }
      await deleteDoc(appSessionsRef);
      return true;
    } catch (err) {
      throw new Error(err);
    }
  };
};

export default FirebaseSessionHandler