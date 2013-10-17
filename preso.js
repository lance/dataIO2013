var container = require('vertx/container');

var webConfig = {
  "web_root": ".",
  "port": 8080,
  "bridge": true,
  "inbound_permitted": [{}],
  "outbound_permitted": [{}],
};

container.deployModule("io.vertx~mod-web-server~2.0.0-final", webConfig);
