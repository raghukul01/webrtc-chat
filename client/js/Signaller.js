
function Signaller(root) {
  var myid = root.userid;
  var peers = {};
  var peerIds = [];
  var textReceiver = new TextReceiver();
  var fileReceiver = new FileReceiver();
  var self = this;
  var signaller = this;
  // Handler for all the messages recieved from the signaller. Signalling implementation just needs to call this method.
  this.onmessage = function(message) {
    console.log(message);
    message = JSON.parse(message.data);
    //logging
    console.debug(JSON.stringify(message, function(key, value) {
      if (value && value.sdp) {
        console.log(value.sdp.type, '____', value.sdp.sdp);
        return '';
      } else return value;
    }, '____'));

    //someone shared an SDP
    if(message.myid) {
      myid = message.userid;
      root.userid = message.userid;
    }
    if (message.sdp && message.to == myid) {
      self.onsdp(message);
    }
    if (message.candidate && message.to == myid) {
      self.onice(message);
    }
    if (message.connectionRequest && message.to == myid) {
      self.connectionRequest(message);
    }
  }

  this.join = function(_config) {
    console.log(_config)
    this.signal({
      connectionRequest: true,
      to: _config,
    });
    //signaler.sentParticipationRequest = true;
  };

  this.connectionRequest = function(message) {
    console.log('connectionRequest');
    var _options = merge(options, {
      to: message.userid
    });
    peers[message.userid] = Offer.createOffer(_options);
  };

  this.onice = function(message) {
    var peer = peers[message.userid];
    if (peer) peer.addIceCandidate(message.candidate);
  }

  this.onsdp = function(message) {
    var sdp = message.sdp;

    if(sdp.type == 'offer') {
      var _options = merge(options, {
        to: message.userid,
        sdp: sdp
      });
      peers[message.userid] = Answer.createAnswer(_options);
    }
    if(sdp.type == 'answer') {
      peers[message.userid].setRemoteDescription(sdp);
    }
  }

  // It is passed over Offer/Answer objects for reusability.
  // These event handler are used by the DataChannel.
  var options = {
    onsdp: function(e) {
      signaller.signal({
        sdp: e.sdp,
        to: e.userid
      });
    },
    onicecandidate: function(e) {
      signaller.signal({
        candidate: e.candidate,
        to: e.userid
      });
    },
    onopen: function(e) {
      if (root.onopen) root.onopen(e);

      if (!root.channels) root.channels = { };
      root.channels[e.userid] = {
        send: function(message) {
          root.send(message, this.channel);
        },
        channel: e.channel
      };

    },
    onmessage: function(e) {
      var message = e.data;
      if (!message.size)
        message = JSON.parse(message);

      if (message.type == 'text')
        textReceiver.receive({
          data: message,
          root: root,
          userid: e.userid
        });

        else if (message.size || message.type == 'file')
          fileReceiver.receive({
            data: message,
            root: root,
            userid: e.userid
          });
          else if (root.onmessage)
            root.onmessage(message, e.userid);
    },
    onclose: function(e) {
      if (root.onclose) root.onclose(e);

      var myChannels = root.channels,
        closedChannel = e.currentTarget;

      for (var _userid in myChannels) {
        if (closedChannel === myChannels[_userid].channel)
          delete root.channels[_userid];
      }

      console.error('DataChannel closed', e);
    },
    onerror: function(e) {
      if (root.onerror) root.onerror(e);

      console.error('DataChannel error', e);
    },
    bandwidth: root.bandwidth
  };

  // Websocket signalling implementation
  var socket = new WebSocket('ws://localhost:3456');

  socket.onmessage = this.onmessage;

  this.signal = function(data) {
    data.userid = myid;
    socket.send(JSON.stringify(data));
  };

}
