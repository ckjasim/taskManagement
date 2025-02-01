import { auth, provider, signInWithPopup, db, doc, setDoc, getDoc } from "../config/firebaseConfig";

const signUpWithGoogle = async (navigate: (arg0: string) => void) => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user already exists in Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Store user data in Firestore
      await setDoc(userRef, {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid,
      });
    }

    console.log("User signed up:", user);
    navigate("/task");
    return user;
  } catch (error:any) {
    console.error("Error signing up with Google:", error.message);
  }
};

export default signUpWithGoogle;
