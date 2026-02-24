import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  roomId: string;
  clientId: string;
  message: string;
}

function App() {
  const [myId, setMyId] = useState();
  const [rooms, setRooms] = useState<Record<string, ChatMessage[]>>({});
  const [currentRoom, setCurrentRoom] = useState<string>("1234");

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const roomInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket>(null);
  useEffect(() => {
    console.log("Current room changed:", currentRoom);
  }, [currentRoom]);

  function sendRoomId() {
    const roomId = roomInputRef.current?.value;
    if (wsRef.current && roomId) {
      wsRef.current.send(
        JSON.stringify({
          type: "join",
          payload: {
            roomId: roomId,
            clientId: myId,
          },
        }),
      );
      setCurrentRoom(roomId);
      console.log(currentRoom);
    }
    if (roomInputRef.current) {
      roomInputRef.current.value = "";
    }
  }

  function Send() {
    const message = inputRef.current?.value;
    console.log("myId is " + myId);

    if (wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: "chat",
          payload: {
            message: message,
            clientId: myId,
            roomId: currentRoom,
          },
        }),
      );
    }

    if (inputRef.current) {
      console.log(message);

      inputRef.current.value = "";
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rooms, currentRoom]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "chat") {
        const { roomId } = data.payload;

        setRooms((prev) => ({
          ...prev,
          [roomId]: [...(prev[roomId] || []), data.payload],
        }));

        console.log("hi, i'm data", data.payload.message);
      }

      if (data.type === "init") {
        setMyId(data.clientId);
        console.log("init clientId " + data.clientId);

        ws.send(
          JSON.stringify({
            type: "join",
            payload: {
              roomId: "1234",
              clientId: data.clientId,
            },
          }),
        );
      }
    };

    wsRef.current = ws;

    // ws.onopen = ()=>{
    //   ws.send(JSON.stringify({
    //     type:"join",
    //     payload: {
    //       roomId: "123",
    //     }
    //   }))
    // }

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className=" flex  w-screen h-screen">
      <div className=" w-full h-full bg-neutral-200 flex flex-col justify-between py-8 items-center rounded-xl">
        <p className="text-2xl">Welcome</p>
        <div className="flex flex-col overflow-y-scroll no-scrollbar  w-full h-full p-4 px-20">
          {(rooms[currentRoom] || []).map((x, index) =>
            x.clientId === myId ? (
              <ChatTile key={index} type="right" message={x.message} />
            ) : (
              <ChatTile key={index} type="left" message={x.message} />
            ),
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className=" w-full">
          <div className="flex gap-4 justify-between px-8 pt-4 items-center">
            <input
              ref={inputRef}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  Send();
                }
              }}
              type="text"
              placeholder="Type something"
              className="outline-none p-4 w-full h-16 bg-white focus:ring-1 ring-blue-950  rounded-md"
            />
            <button
              onClick={() => {
                Send();
              }}
              className="bg-black w-20 text-white h-16 rounded-md"
            >
              Send
            </button>
          </div>
        </div>
      </div>
      <div className="h-screen flex flex-col items-center py-8 bg-black text-white w-80">
        <p className="text-xl">Sidebar</p>
        <div className="flex gap-2 p-4">
          <input
            ref={roomInputRef}
            type="text"
            placeholder="Enter roomId"
            className="bg-white text-black p-2 w-full flex rounded-md"
          />
          <button
            onClick={() => {
              sendRoomId();
            }}
            className="bg-white p-2 rounded-md text-black"
          >
            Join
          </button>
        </div>
        <div className="bg-white text-gray-500 flex justify-center items-center w-50 rounded-md p-2 h-10">
          Current Group: {currentRoom}
        </div>
      </div>
    </div>
  );
}

type ChatType = {
  type?: "left" | "right";
  message: string;
};

const ChatTile = ({ type, message }: ChatType) => {
  const isRight = type === "right";

  const alignment = isRight ? "flex-row-reverse" : "";
  const bubbleStyle = isRight
    ? "rounded-tr-sm rounded-b-2xl rounded-tl-2xl"
    : "rounded-tl-sm rounded-b-2xl rounded-tr-2xl";

  return (
    <div className={`w-full flex py-4 px-2 ${alignment}`}>
      <p
        className={`bg-black text-white max-w-60 wrap-break-word p-4 ${bubbleStyle}`}
      >
        {message}
      </p>
    </div>
  );
};

export default App;
