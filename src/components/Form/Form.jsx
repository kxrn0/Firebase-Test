import { useState } from "react";
import "./form.css";

export default function Form({ create_counter }) {
    const [file, setFile] = useState(null);
    const [name, setName] = useState('');
    const [src, setSrc] = useState('');
    let elem;

    function update_file(event) {
        const file = event.target.files[0];
        const fileReader = new FileReader();

        fileReader.readAsDataURL(file);

        fileReader.addEventListener("load", event => {
            setSrc(event.target.result);
            setFile(file);
        });
    }

    function update_name(event) {
        setName(event.target.value);
    }

    function handle_submission(event) {
        event.preventDefault();

        if (!name.trim())
            return;

        setFile(null);
        setSrc('');
        setName('');
        create_counter(file, name);
    }

    if (!file)
        elem = (
            <label className="image-label" htmlFor="creation-image">
                <span></span>
                <input
                    type="file"
                    name="image-file"
                    required
                    id="creation-image"
                    onChange={update_file}
                />
            </label>
        );
    else elem = <img src={src} alt="image file" className="image-file" />;

    return (
        <form className="creation-form" onSubmit={handle_submission}>
            {elem}
            <input type="text" name="counter-name" value={name} onChange={update_name} required />
            <button type="submit">Create Counter</button>
        </form>
    );
}
