const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

// auth router attaches /login, /logout, and /callback routes to the baseURL
const { requiresAuth } = require('express-openid-connect');
const { auth } = require('express-openid-connect');

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'ahgjfhgahfgiurhaerngjancnvbajdfhbuarjnanrjgkalrjgnanjergaekrgbarhak',
  baseURL: 'http://localhost:3000',
  clientID: 'bPFr0KH8F9zgIOeFu3yrMAJsbHR5neN5',
  issuerBaseURL: 'https://dev-ks0tfjwi7e8p3bp2.us.auth0.com'
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// req.isAuthenticated is provided from the auth router
app.get('/', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? res.redirect('/call') : res.redirect('/home'));
});


app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/call", requiresAuth(), (req, res) => {
  res.render("room", { roomId: req.params.room });
});

app.get("/home", (req, res) => {
  res.render("home");
});

io.on("connection", socket => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);
    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  })
});

server.listen(3000);