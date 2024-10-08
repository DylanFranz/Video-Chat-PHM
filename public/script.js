const socket = io('/');
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer();
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};


navigator.mediaDevices.getUserMedia({
  video: true, 
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream);

  myPeer.on("call", call => {
    call.answer(stream);
    const userVideo = document.createElement("video");
    call.on("stream", userVideoStream => {
      addVideoStream(userVideo, userVideoStream);
    });
  });

  socket.on("user-connected", userId => {
    connectToNewUser(userId, stream);
  });
});

socket.on("user-disconnected", userId => {
  if (peers[userId]) {
    peers[userId].close();
  }
});

myPeer.on("open", id => {
  socket.emit("join-room", ROOM_ID, id);
});

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const userVideo = document.createElement("video");
  call.on("stream", userVideoStream => {
    addVideoStream(userVideo, userVideoStream);
  });
  call.on("close", () => {
    userVideo.remove();
  });

  peers[userId] = call;
}