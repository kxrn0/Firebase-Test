import "./counter.css";

import { useState } from "react";

export default function Counter({ id, name, value, count, update_name }) {
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

    return (
        <div className="counter">
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
