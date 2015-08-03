var Answer = {
  createAnswer: function(config) {
    var peer = new RTCPeerConnection(iceServers, optionalArgument),
      channel;

    if (isChrome)
      RTCDataChannel.createDataChannel(peer, config);
    else if (isFirefox) {
      peer.ondatachannel = function(event) {
        channel = event.channel;
        channel.binaryType = 'blob';
        RTCDataChannel.setChannelEvents(channel, config);
      };

      navigator.mozGetUserMedia({
        audio: true,
        fake: true
      }, function(stream) {

        peer.addStream(stream);
        peer.setRemoteDescription(new RTCSessionDescription(config.sdp), onSdpSuccess, onSdpError);
        peer.createAnswer(function(sdp) {
          peer.setLocalDescription(sdp);
          config.onsdp({
            sdp: sdp,
            userid: config.to
          });
        }, onSdpError, offerAnswerConstraints);

      }, mediaError);
    }

    peer.onicecandidate = function(event) {
      if (event.candidate) {
        config.onicecandidate({
          candidate: event.candidate,
          userid: config.to
        });
      }
    };

    peer.oniceconnectionstatechange = function() {
      // "disconnected" state: Liveness checks have failed for one or more components.
      // This is more aggressive than failed, and may trigger intermittently
      // (and resolve itself without action) on a flaky network.
      if (!!peer && peer.iceConnectionState == 'disconnected') {
        peer.close();
        console.error('iceConnectionState is <disconnected>.');
      }
    };

    if (isChrome) {
      peer.setRemoteDescription(new RTCSessionDescription(config.sdp), onSdpSuccess, onSdpError);
      peer.createAnswer(function(sdp) {
        sdp = serializeSdp(sdp, config);
        peer.setLocalDescription(sdp);

        config.onsdp({
          sdp: sdp,
          userid: config.to
        });
      }, onSdpError, offerAnswerConstraints);
    }

    this.peer = peer;

    return this;
  },
  addIceCandidate: function(candidate) {
    this.peer.addIceCandidate(new RTCIceCandidate({
      sdpMLineIndex: candidate.sdpMLineIndex,
      candidate: candidate.candidate
    }));
  }
};
