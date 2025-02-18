import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:4000", { autoConnect: false });

const App: React.FC = () => {
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ user: string; text: string }[]>([]);

  const login = async () => {
    const { data } = await axios.post("http://localhost:4000/login", { username });
    setToken(data.token);
    socket.auth = { token: data.token };
    socket.connect();
  };

  useEffect(() => {
    socket.on("message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("chatHistory", (history) => setMessages(history));
    return () => {
      socket.off("message");
      socket.off("chatHistory");
    };
  }, []);

  const joinRoom = () => {
    socket.emit("joinRoom", room);
  };

  const sendMessage = () => {
    socket.emit("sendMessage", { room, message });
    setMessage("");
  };

  return (
    <div>
      {!token ? (
        <>
          <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
          <button onClick={login}>Login</button>
        </>
      ) : (
        <>
          <input placeholder="Room" onChange={(e) => setRoom(e.target.value)} />
          <button onClick={joinRoom}>Join Room</button>

          <div>
            {messages.map((msg, index) => (
              <div key={index}><b>{msg.user}</b>: {msg.text}</div>
            ))}
          </div>

          <input value={message} onChange={(e) => setMessage(e.target.value)} />
          <button onClick={sendMessage}>Send</button>
        </>
      )}
    </div>
  );
};

export default App;