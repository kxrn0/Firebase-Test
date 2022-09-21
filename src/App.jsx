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
} from "firebase/firestore";
import {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
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

        if (!input.value.trim()) return;

        try {
            await addDoc(
                collection(
                    getFirestore(),
                    `users/${getAuth().currentUser.uid}/counters`
                ),
                {
                    name: input.value,
                    timestamp: serverTimestamp(),
                    value: 0,
                }
            );
            //...
            event.target.reset();
        } catch (error) {
            console.log(`Error: ${error}`);
        }
    }

    function remove_counter(id) {
        setCounters((prevCounters) =>
            prevCounters.filter((counter) => counter.id !== id)
        );
    }

    function update_counter(name, id, value) {
        setCounters((prevCounters) => {
            const index = prevCounters.findIndex(
                (counter) => counter.id === id
            );

            if (index === -1) return [...prevCounters, { id, name, value }];
            else {
                const counter = prevCounters[index];

                return prevCounters
                    .slice(0, index)
                    .concat({ ...counter, name, value })
                    .concat(prevCounters.slice(index + 1));
            }
        });
    }

    function load_counters() {
        const counters = query(
            collection(
                getFirestore(),
                `users/${getAuth().currentUser.uid}/counters`
            )
        );

        onSnapshot(counters, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "removed") remove_counter(change.doc.id);
                else {
                    const counter = change.doc.data();

                    update_counter(counter.name, change.doc.id, counter.value);
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
                <input type="text" name="counter-name" />
                <button type="submit">Create Counter</button>
            </form>

            <div className="counters">
                {counters.map((counter) => (
                    <Counter
                        key={counter.id}
                        name={counter.name}
                        id={counter.id}
                        value={counter.value}
                        count={handle_input}
                        update_name={update_name}
                    />
                ))}
            </div>
        </div>
    );
}

export default App;
