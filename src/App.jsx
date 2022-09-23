import { config } from "./config";

import { initializeApp } from "firebase/app";
import {
    getAuth,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
} from "firebase/auth";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    setDoc,
    updateDoc,
    doc,
    serverTimestamp,
    getDoc,
    deleteDoc,
} from "firebase/firestore";
import {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
} from "firebase/storage";
import { useEffect, useState } from "react";
import Counter from "./Counter";

import "./style.css";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [counters, setCounters] = useState([]);

    async function sign_in() {
        const provider = new GoogleAuthProvider();

        await signInWithPopup(getAuth(), provider);
    }

    function sign_out() {
        signOut(getAuth());
    }

    async function create_counter(event) {
        event.preventDefault();

        const input = event.target["counter-name"];
        const fileInput = event.target["image-file"];

        if (!input.value.trim()) return;

        try {
            const counterRef = await addDoc(
                collection(
                    getFirestore(),
                    `users/${getAuth().currentUser.uid}/counters`
                ),
                {
                    name: input.value,
                    timestamp: serverTimestamp(),
                    value: 0,
                    imageURL: "https://www.google.com/images/spin-32.gif",
                }
            );

            const file = fileInput.files[0];
            const filePath = `users/${getAuth().currentUser.uid}/${
                counterRef.id
            }/${file.name}`;
            const counterImageRef = ref(getStorage(), filePath);
            const fileSnapshot = await uploadBytesResumable(
                counterImageRef,
                file
            );
            const publicImageURL = await getDownloadURL(counterImageRef);
            event.target.reset();

            await updateDoc(counterRef, {
                imageURL: publicImageURL,
                storageUri: fileSnapshot.metadata.fullPath,
            });

            //...
        } catch (error) {
            console.log(`Error: ${error}`);
        }
    }

    async function remove_counter({ id, storageUri }) {
        setCounters((prevCounters) =>
            prevCounters.filter((counter) => counter.id !== id)
        );
        try {
            const docRef = doc(
                getFirestore(),
                `users/${getAuth().currentUser.uid}/counters`,
                id
            );
            const imageRef = ref(getStorage(), storageUri);

            // await deleteObject(imageRef);
            // await deleteDoc(docRef);

            console.log(`~~storage URI~~ : ${storageUri}`);
            console.log(imageRef);
            deleteObject(imageRef);
            deleteDoc(docRef);
        } catch (wrror) {
            console.log(`Error deleting document: ${wrror}`);
        }
    }

    function update_counter(name, id, value, imageURL, storageUri) {
        setCounters((prevCounters) => {
            const index = prevCounters.findIndex(
                (counter) => counter.id === id
            );

            if (index === -1)
                return [
                    ...prevCounters,
                    { id, name, value, imageURL, storageUri },
                ];
            else {
                const counter = prevCounters[index];

                return prevCounters
                    .slice(0, index)
                    .concat({ ...counter, name, value, imageURL })
                    .concat(prevCounters.slice(index + 1));
            }
        });
    }

    function load_counters() {
        const counters = query(
            collection(
                getFirestore(),
                `users/${getAuth().currentUser.uid}/counters`
            ),
            orderBy("timestamp", "asc")
        );

        onSnapshot(counters, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "removed") remove_counter(change.doc.id);
                else {
                    const counter = change.doc.data();

                    update_counter(
                        counter.name,
                        change.doc.id,
                        counter.value,
                        counter.imageURL,
                        counter.storageUri
                    );
                }
            });
        });
    }

    async function handle_input(id, value) {
        const docRef = doc(
            getFirestore(),
            `users/${getAuth().currentUser.uid}/counters`,
            id
        );
        const docSnap = await getDoc(docRef);
        const count = docSnap.data().value;

        updateDoc(docRef, { value: count + value });
    }

    function update_name(value, id) {
        const docRef = doc(
            getFirestore(),
            `users/${getAuth().currentUser.uid}/counters`,
            id
        );

        updateDoc(docRef, { name: value });
    }

    async function replace_image(counter, file) {
        /**
         * I want to replace the image of the counter, I guess what I sneed to do is
         * first delete the image, then replace it with the new one. I think it would be useful
         * if the image were temporaly replaced by a loading spinner to indicate that the image
         * is being replaced.
         *
         * What I need to delete the image is the id of the counter, and the storageUri, I will also need
         * a reference to the counter that will be associated with the image.
         *
         * Let's delete the image first.
         */

        const imageRef = ref(getStorage(), counter.storageUri);
        const docRef = doc(
            getFirestore(),
            `users/${getAuth().currentUser.uid}/counters`,
            counter.id
        );
        const filePath = `users/${getAuth().currentUser.uid}/${counter.id}/${
            file.name
        }`;
        const counterImageRef = ref(getStorage(), filePath);
        let fileSnapshot, publicImageURL;

        fileSnapshot = uploadBytesResumable(counterImageRef, file).then(result =>
            getDownloadURL(counterImageRef).then((res) =>
                updateDoc(docRef, {
                    imageURL: res,
                    storageUri: result.metadata.fullPath,
                })
            )
        );
        // const fileSnapshot = await uploadBytesResumable(counterImageRef, file);
        // const publicImageURL = await getDownloadURL(counterImageRef);

        updateDoc(docRef, {
            imageURL: "https://www.google.com/images/spin-32.gif",
        });
        deleteObject(imageRef);
        await updateDoc(docRef, {
            imageURL: publicImageURL,
            storageUri: fileSnapshot.metadata.fullPath,
        });
    }

    useEffect(() => {
        initializeApp(config);
    }, []);

    useEffect(() => {
        onAuthStateChanged(getAuth(), () => {
            setIsLoggedIn(() => !!getAuth().currentUser);
            if (getAuth().currentUser) load_counters();
        });
    }, []);

    return (
        <div className="App">
            <nav className="navbar">
                <p>Thing Counter</p>
                {isLoggedIn ? (
                    <button className="log-out" onClick={sign_out}>
                        Log Out
                    </button>
                ) : (
                    <button className="log-in" onClick={sign_in}>
                        Log In
                    </button>
                )}
            </nav>

            <form className="creation-form" onSubmit={create_counter}>
                <input type="file" name="image-file" />
                <input type="text" name="counter-name" />
                <button type="submit">Create Counter</button>
            </form>

            <div className="counters">
                {counters.map((counter) => (
                    <Counter
                        key={counter.id}
                        update_name={update_name}
                        remove={remove_counter}
                        counter={counter}
                        count={handle_input}
                        replace={replace_image}
                    />
                ))}
            </div>
        </div>
    );
}

export default App;
