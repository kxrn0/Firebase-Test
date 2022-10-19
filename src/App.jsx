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
import Form from "./components/Form/Form";
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

    async function create_counter(file, name) {
        try {
            const documentCounter = {
                name: name,
                timestamp: serverTimestamp(),
                value: 0,
                imageURL: "https://www.google.com/images/spin-32.gif",
            };
            const counterRef = await addDoc(
                collection(
                    getFirestore(),
                    `users/${getAuth().currentUser.uid}/counters`
                ),
                documentCounter
            );
            const filePath = `users/${getAuth().currentUser.uid}/${
                counterRef.id
            }/${file.name}`;
            const counterImageRef = ref(getStorage(), filePath);
            const fileSnapshot = await uploadBytesResumable(
                counterImageRef,
                file
            );
            const imageURL = await getDownloadURL(counterImageRef);
            const storageUri = fileSnapshot.metadata.fullPath;

            await updateDoc(counterRef, {
                imageURL,
                storageUri,
            });
            documentCounter.imageURL = imageURL;
            documentCounter.storageUri = storageUri;
            documentCounter.id = counterRef.id;

            setCounters((prevCounters) => [
                ...prevCounters.slice(0, prevCounters.length - 1),
                documentCounter,
            ]);
        } catch (error) {
            console.log(`Error: ${error}`);
        }
    }

    async function remove_counter({ id, storageUri }) {
        try {
            const docRef = doc(
                getFirestore(),
                `users/${getAuth().currentUser.uid}/counters`,
                id
            );
            const imageRef = ref(getStorage(), storageUri);

            await deleteDoc(docRef);
            await deleteObject(imageRef);

            setCounters((prevCounters) =>
                prevCounters.filter((counter) => counter.id !== id)
            );
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
        try {
            const imageRef = ref(getStorage(), counter.storageUri);
            const docRef = doc(
                getFirestore(),
                `users/${getAuth().currentUser.uid}/counters`,
                counter.id
            );
            const filePath = `users/${getAuth().currentUser.uid}/${
                counter.id
            }/${file.name}`;
            const counterImageRef = ref(getStorage(), filePath);
            let fileSnapshot, imageURL, storageUri;

            updateDoc(docRef, {
                imageURL: "https://www.google.com/images/spin-32.gif",
            });
            fileSnapshot = await uploadBytesResumable(counterImageRef, file);
            imageURL = await getDownloadURL(counterImageRef);
            storageUri = fileSnapshot.metadata.fullPath;

            await updateDoc(docRef, { imageURL, storageUri });
            setCounters((prevCounters) => {
                const index = prevCounters.findIndex(
                    (other) => other.id === counter.id
                );
                return prevCounters
                    .slice(0, index)
                    .concat({ ...counter, imageURL, storageUri })
                    .concat(prevCounters.slice(index + 1));
            });
            await deleteObject(imageRef);
        } catch (wee) {
            console.log(wee);
        }
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
        <>
            {!isLoggedIn ? (
                <button className="log-in" onClick={sign_in}>
                    Log In
                </button>
            ) : (
                <div className="App">
                    <nav className="navbar">
                        <p>Thing Counter</p>
                        <button className="log-out" onClick={sign_out}>
                            Log Out
                        </button>
                    </nav>

                    <Form create_counter={create_counter} />

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
            )}
        </>
    );
}

export default App;
