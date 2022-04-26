import http from "http";
import { Server } from "socket.io";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));


const server = http.createServer(app);
const wsServer = new Server(server)

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}


wsServer.on("connection", (socket) => {
  wsServer.sockets.emit("room_change", publicRooms());
  socket["nickname"] = "Anon";
  socket.onAny((event) => {
    console.log(`Socket Event: ${event}`);
  });
  socket.on("join_room", (roomName, nickname, done) => {
    socket["nickname"] = nickname;
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome");
    socket.on("offer", (offer, roomName) => {
      socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
      socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice", (ice, roomName) => {
      socket.to(roomName).emit("ice", ice);
    });
  });
  // socket.on("disconnecting", () => {
  //   socket.rooms.forEach((room) =>
  //     socket.to(room).emit("bye", socket.id)
  //   );
  //   socket.on("disconnect", () => {
  //     wsServer.sockets.emit("room_change", publicRooms());
  //   });
  // });


  // socket.on("new_message", (msg, room, done) => {
  //   socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
  //   done();
  //   socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
  // });
});


const handleListen = () => console.log(`Listening on http://localhost:3000`);
server.listen(3000, handleListen);