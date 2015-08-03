
function TextReceiver() {
  var content = [];

  function receive(config) {
    var root = config.root;
    var data = config.data;

    content.push(data.message);
    if (data.last) {
      if (root.onmessage)
        root.onmessage({
          data: content.join(''),
          userid: config.userid
        });
        content = [];
    }
  }

  return {
    receive: receive
  };
}
