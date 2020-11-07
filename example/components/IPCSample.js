import React, { useState, useEffect } from "react";

export default function IPCSample() {
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
      <h2>IPC Example</h2>
      {message && <p>Answer from main: {message}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </form>
    </>
  );
}
