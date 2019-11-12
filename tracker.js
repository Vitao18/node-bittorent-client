const dgram = require("dgram");
const crypto = require("crypto");
const Buffer = require("buffer").Buffer;
const urlParse = require("url").parse;

const udpSend = (socket, message, rawUrl, callback = () => {}) => {
  const url = urlParse(rawUrl);
  socket.send(message, 0, message.length, url.port, url.host, callback);
};

const respType = resp => {};
const buildConnReq = () => {
  const buf = Buffer.alloc(16);
  // connection id
  buf.writeUInt32BE("0x417", 0);
  buf.writeUInt32BE("0x27101980", 4);
  // action
  buf.writeUInt32BE(0, 8);
  // transaction id
  crypto.randomBytes(4).copy(buf, 12);

  return buf;
};
const parseConnResp = resp => ({
  action: resp.readUInt32BE(0),
  action: resp.readUInt32BE(4),
  action: resp.slice(8)
});
const buildAnnounceReq = () => {};
const parseAnnounceResp = () => {};

module.exports.getPeers = (torrent, callback) => {
  const socket = dgram.createSocket("udp4");
  const url = torrent.announce.toString("utf8");

  udpSend(socket, buildConnReq(), url);

  socket.on("message", response => {
    if (respType(response) === "connect") {
      const connResp = parseConnResp(response);
      const announceReq = buildAnnounceReq(connResp.connectionId);
      udpSend(socket, announceReq, url);
    } else if (respType(response) === "announce") {
      const announceResp = parseAnnounceResp(response);

      callback(announceResp.peers);
    }
  });
};
