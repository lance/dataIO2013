var container = require('vertx/container');
var bus = require('vertx/event_bus');

var webConfig = {
  'web_root': '.',
  'port': 8080,
  'bridge': true,
  'inbound_permitted': [{}],
  'outbound_permitted': [{}],
};
container.deployModule('io.vertx~mod-web-server~2.0.0-final', webConfig);

var mongoConfig = {
    'address': 'demo.mongo',
    'host': '127.0.0.1',
    'port': 27017,
    'pool_size': 20,
    'db_name': 'demo',
}

var setupDemoData = function() {
  var demoData = [
    { image: "/images/keaton.gif",  name: "Buster Keaton",   votes: 0, comments: [] },
    { image: "/images/chaplin.jpg", name: "Charlie Chaplin", votes: 0, comments: [] },
    { image: "/images/marceau.jpg", name: "Marcel Marceau",  votes: 0, comments: [] }
  ]

  // clear the demo data
  bus.send(mongoConfig.address, {
    action: "delete",
    collection: "candidates",
    matcher: {}
  }, function() {
    // once we've deleted, now add back
    for (i in demoData) {
      bus.send(mongoConfig.address, {
        action: "save",
        collection: "candidates",
        document: demoData[i]
      });
    }
  });

}
container.deployModule('io.vertx~mod-mongo-persistor~2.0.0-final', mongoConfig, setupDemoData);
