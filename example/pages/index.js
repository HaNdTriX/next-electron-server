import { useState, useEffect } from "react";
import Link from "next/link";

export default function IndexPage() {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const handleMessage = (event, message) => setMessage(message);
    global.ipcRenderer.on("message", handleMessage);

    return () => {
      global.ipcRenderer.removeListener("message", handleMessage);
    };
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    global.ipcRenderer.send("message", input);
    setMessage(null);
  };

  return (
    <>
      <h1>Index Page</h1>
      {message && <p>Answer from main: {message}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </form>

      <ul>
        <li>
          <Link href="/about">
            <a>About</a>
          </Link>
        </li>
        <li>
          <a href="/invalid">Invalid (triggers 404)</a>
        </li>
      </ul>
    </>
  );
}
