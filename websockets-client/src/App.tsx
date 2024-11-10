import "./App.css";
import { useEffect, useState } from "react";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";

function App() {
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState<null | WebSocket>(null);
  const [chat, setChat] = useState<string[]>([]);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3000");
    socket.onopen = () => {
      setSocket(socket);
      socket.send(
        JSON.stringify({
          type: "join",
          payload: {
            roomId: window.location.pathname,
          },
        })
      );
    };
    socket.onmessage = (data) => {
      setChat((prev) => [data.data, ...prev]);
    };
    return () => {
      socket.close();
    };
  }, []);

  if (!socket) return <div>Connecting...</div>;

  const sendMessage = () => {
    socket.send(
      JSON.stringify({
        type: "message",
        payload: {
          message: message,
        },
      })
    );
    setMessage("");
  };

  return (
    <div className="min-h-dvh">
      <div className="flex w-full max-w-sm items-center space-x-2 mx-auto">
        <Input
          onChange={(e) => setMessage(e.target.value)}
          type="text"
          placeholder="Message"
          value={message}
        />
        <Button onClick={sendMessage}>Send</Button>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-2">
        {chat?.map((singleChat) => (
          <div className="bg-slate-200 p-2 rounded-md">{singleChat}</div>
        ))}
      </div>
    </div>
  );
}

export default App;
