import WebSocket from "ws";

const chatId = process.argv[2];
if (!chatId) {
  console.error("Usage: node test-websocket.js <escalatedChatId>");
  process.exit(1);
}

const wsUrl = process.env.WS_URL || "ws://localhost:3000/ws";
console.log(`Connecting to ${wsUrl} for chat ${chatId}...`);

const ws = new WebSocket(wsUrl);

ws.on("open", () => {
  console.log("Connected to WebSocket server");
  
  // Join as agent
  const joinMsg = { type: "join", chatId, role: "agent" };
  console.log("Sending join:", joinMsg);
  ws.send(JSON.stringify(joinMsg));

  setTimeout(() => {
    // Send a message
    const testMsg = { type: "message", chatId, text: "Hello! Human support agent joined.", role: "agent" };
    console.log("Sending message:", testMsg);
    ws.send(JSON.stringify(testMsg));
  }, 1000);
});

ws.on("message", (data) => {
  console.log("Received:", JSON.parse(data.toString()));
});

ws.on("error", (err) => {
  console.error("WebSocket error:", err);
});

ws.on("close", (code, reason) => {
  console.log(`WebSocket closed: code=${code}, reason=${reason}`);
});
