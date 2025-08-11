const dgram = require('dgram');
const Speaker = require('speaker');
const express = require('express');
const http = require('http');
const path = require('path');

const UDP_PORT = 7355;           // UDP PCM16 input port
const UDP_HOST = '127.0.0.1';    // UDP input host
const HTTP_PORT = 8080;          // HTTP server port

const app = express();
const server = http.createServer(app);

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Create a route for the audio stream
app.get('/audio-stream', (req, res) => {
  console.log('entered in /audio-stream');
  res.set({
    'Content-Type': 'audio/pcm',
    'Transfer-Encoding': 'chunked'
  });

  // Add this response to active streams
  activeStreams.push(res);

  req.on('close', () => {
    console.log('closed in /audio-stream');
    const index = activeStreams.indexOf(res);
    if (index > -1) {
      activeStreams.splice(index, 1);
    }
  });
});

// Keep track of all active HTTP streams
const activeStreams = [];

// Setup the speaker to play raw PCM16 16kHz mono audio locally
const speaker = new Speaker({
  channels: 1,
  bitDepth: 16,
  sampleRate: 48000,
  signed: true,
  float: false,
  endian: 'little',
});

speaker.on('error', (err) => {
  console.error('Speaker error:', err);
});

// Setup UDP socket to receive raw PCM16 audio from source
const udpServer = dgram.createSocket('udp4');


udpServer.on('message', (msg) => {
  // Play audio locally through speaker
  //speaker.write(msg);

  // Send to all active HTTP streams
  activeStreams.forEach(stream => {
    try {
      stream.write(msg);
    } catch (err) {
      console.error('Error writing to stream:', err);
    }
  });
});

udpServer.on('error', (err) => {
  console.error('UDP Server error:', err);
  udpServer.close();
});

udpServer.bind(UDP_PORT, UDP_HOST, () => {
  console.log(`UDP server listening for PCM16 audio on udp://${UDP_HOST}:${UDP_PORT}`);
});

// Start HTTP server
server.listen(HTTP_PORT, () => {
  console.log(`HTTP server started on http://localhost:${HTTP_PORT}`);
});
