import "./counter.css";

import Image from "./components/Image/Image";

import { useState } from "react";

export default function Counter({
    update_name,
    remove,
    counter,
    count,
    replace,
}) {
    const { id, name, value, imageURL } = counter;
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState(name);
    const [prevName, setPrevName] = useState(name);

    function handle_change(event) {
        event.preventDefault();

        const value = event.target["counter-name"].value.trim();

        if (value || value == prevName) {
            update_name(value, id);
            setPrevName(value);
        }
        setEditingName(false);
    }

    function handle_input(event) {
        setNewName(event.target.value);
    }

    function change_image(event) {
        const file = event.target.files[0];

        replace(counter, file);
    }

    return (
        <div className="counter">
            <div className="controls">
                <Image src={imageURL} alt="image" />
                <button
                    className="remove"
                    onClick={() => remove(counter)}
                ></button>
                <label htmlFor={`change-image-${id}`} className="change-image">
                    <input
                        type="file"
                        id={`change-image-${id}`}
                        onChange={change_image}
                    />
                </label>
            </div>
            <div className="container">
                {editingName ? (
                    <form onSubmit={handle_change}>
                        <input
                            type="text"
                            name="counter-name"
                            className="counter-name"
                            onChange={handle_input}
                            value={newName}
                        />
                        <button>change name</button>
                    </form>
                ) : (
                    <p
                        className="counter-name"
                        onClick={() => setEditingName(true)}
                    >
                        {name}
                    </p>
                )}
                <div className="count-section">
                    <button className="decrease" onClick={() => count(id, -1)}>
                        -
                    </button>
                    <span>{value}</span>
                    <button className="increase" onClick={() => count(id, 1)}>
                        +
                    </button>
                </div>
            </div>
        </div>
    );
}
