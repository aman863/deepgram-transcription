const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
const http = require("http");
const server = http.createServer(app);
const WebSocket = require("ws");
const socketIo = require("socket.io");
const { Deepgram } = require("@deepgram/sdk");

const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

function handle_connection(socket) {
  const deepgram = new Deepgram("fee38a99981b6e0cae7ee9f61de87e69df8e2a03");

  const dgSocket = deepgram.transcription.live({
    // punctuate: true,
    encoding: "linear16",
    sample_rate: 16000,
    channel: 1,
  });

  dgSocket.addListener("open", () => {
    console.log("deepgram connected");
    socket.emit("can-open-mic");
  });

  socket.on("microphone-stream", (stream) => {
    if (dgSocket.getReadyState() === WebSocket.OPEN) {
      dgSocket.send(stream);
    }
  });

  dgSocket.addListener("close", (error) => {
    console.log(error.target._events.error);
  });

  dgSocket.addListener("transcriptReceived", (transcription) => {
    io.emit("transcript-result", transcription);
  });

  socket.on("stopRecording", () => {
    if (dgSocket.getReadyState() === WebSocket.OPEN) {
      dgSocket.finish();
    }
  });
}

io.sockets.on("connection", handle_connection);

server.listen(5000, () => {
  console.log("Server listening at port 5000");
});
