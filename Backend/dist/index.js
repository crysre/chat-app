import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";
const wss = new WebSocketServer({ port: 8080 });
let allSocket = [];
wss.on("connection", (socket) => {
    const clientId = randomUUID();
    socket.clientId = clientId;
    socket.send(JSON.stringify({
        type: "init",
        clientId: clientId,
    }));
    //user will send
    // join a room {
    // "type": "join",
    // "payload":{
    //     "roomId": "123"
    //             }
    //     }
    // send a message {
    // "type": "chat",
    // "payload":{
    //     "message": "hi there"
    //             }
    //     }
    socket.on("message", (message) => {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.type === "join") {
            console.log("user joined " + parsedMessage.payload.roomId);
            allSocket.push({
                socket,
                room: parsedMessage.payload.roomId,
                clientId: parsedMessage.payload.clientId,
            });
        }
        if (parsedMessage.type === "chat") {
            const currentUser = allSocket.find((x) => x.socket == socket);
            console.log("user sending " + parsedMessage.payload.message);
            for (let i = 0; i < allSocket.length; i++) {
                if (allSocket[i]?.room == currentUser?.room) {
                    allSocket[i]?.socket.send(JSON.stringify({
                        type: "chat",
                        payload: {
                            message: parsedMessage.payload.message,
                            clientId: parsedMessage.payload.clientId,
                            roomId: currentUser?.room,
                        },
                    }));
                }
            }
        }
    });
    console.log("user connected");
    // socket.on("message", (message)=>{
    //     console.log("message received " + message.toString());
    //     // socket.send(message.toString() + ": sent from the server ")
    //     allSocket.map((s)=>{
    //         s.send(message.toString() + ": sent from the server ")
    //     })
    // })
    socket.on("disconnect", () => {
        allSocket = allSocket.filter((x) => x.socket != socket);
    });
});
//# sourceMappingURL=index.js.map