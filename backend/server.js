const http = require("http");
const express = require("express");
const cors = require("cors");
const socketio = require("socket.io");
const createAdapter = require("@socket.io/redis-adapter").createAdapter;
const redis = require("redis");

const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getChannelUsers,
} = require("./utils/users");

const app = express();
const { createClient } = redis;

const corsOptions = {
  origin: 'http://localhost:5173',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};
app.use(cors(corsOptions));

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const botName = "SkyNet Bot";
let pubClient, subClient;

(async () => {
  try {
    pubClient = createClient({ url: "redis://127.0.0.1:6379" });
    await pubClient.connect();
    subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Successfully connected to Redis adapter...");
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.warn("Redis server is not available. Make sure it's running.");
    } else {
      console.error("Error connecting to Redis:", err);
    }
  }

  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;

  const handleRedisError = async (err, client) => {
    if (err && err.name === 'AbortError') {
      console.warn(`${client === pubClient ? 'pubClient' : 'subClient'}: Redis connection aborted.`);
    } else if (err && err.errors && err.errors.length > 0) {
      const firstError = err.errors[0];
      console.warn(`${client === pubClient ? 'pubClient' : 'subClient'}: ${firstError.message}`);
    } else {
      console.error(`${client === pubClient ? 'pubClient' : 'subClient'} error:`, err);
    }

    // Reconnect retry mechanism
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(`Reconnecting ${client === pubClient ? 'pubClient' : 'subClient'} (Attempt ${reconnectAttempts} of ${maxReconnectAttempts})...`);
      try {
        await client.connect();
        console.log(`Successfully reconnected to ${client === pubClient ? 'pubClient' : 'subClient'}`);
        reconnectAttempts = 0; // resets the counter if reconnection is successfull
      } catch (reconnectError) {
        console.error(`Error reconnecting ${client === pubClient ? 'pubClient' : 'subClient'}:`, reconnectError);
      }
    } else {
      console.error(`Max reconnect attempts reached. Shutting down the application.`);
      process.exit(1);
    }
  };

  pubClient.on('error', (err) => {
    handleRedisError(err, pubClient);
  });

  subClient.on('error', (err) => {
    handleRedisError(err, subClient);
  });
})();

// Run when client connects
io.on("connection", (socket) => {
  // console.log(io.of("/").adapter);
  socket.on("joinChannel", ({ username, channel }) => {
    const user = userJoin(socket.id, username, channel);

    socket.join(user.channel);

    io.to(user.channel).emit("channelUsers", {
      channel: user.channel,
      users: getChannelUsers(user.channel),
    });

    socket.emit("message", formatMessage(botName, "Welcome to SkyNet Chat!"));

    socket.broadcast
      .to(user.channel)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );
  });

  socket.on('chatMessage', ({ text, user, channel }) => {
    io.to(channel).emit('message', formatMessage(user.username, text));
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.channel).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      io.to(user.channel).emit("channelUsers", {
        channel: user.channel,
        users: getChannelUsers(user.channel),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}...`));
