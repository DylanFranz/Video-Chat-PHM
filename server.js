const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
require('dotenv').config();

// auth router attaches /login, /logout, and /callback routes to the baseURL
const { requiresAuth } = require('express-openid-connect');
const { auth } = require('express-openid-connect');

console.log(process.env.AUTH0_SECRET);
console.log(process.env.AUTH0_BASEURL);
console.log(process.env.AUTH0_CLIENTID);
console.log(process.env.AUTH0_ISSUERBASEURL);

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: `${process.env.AUTH0_SECRET}`,
  baseURL: process.env.AUTH0_BASEURL,
  clientID: `${process.env.AUTH0_CLIENTID}`,
  issuerBaseURL: `${process.env.AUTH0_ISSUERBASEURL}`
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
  res.render("room", { roomId: req.params.room, user: req.oidc.user });
});

app.get("/home", (req, res) => {
  res.render("home", { user: req.oidc.user  });
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