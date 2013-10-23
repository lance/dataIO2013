var bus       = require('vertx/event_bus');
var timer     = require('vertx/timer');
var console   = require('vertx/console');
var container = require('vertx/container');

var mongoConfig = {
    'address': 'demo.mongo',
    'host': '127.0.0.1',
    'port': 27017,
    'pool_size': 20,
    'db_name': 'demo',
}

var hackElection = function() {
  // every seconds add a few votes to Charlie's count
  timer.setPeriodic(1000, fetchAndUpdate);
}

var fetchAndUpdate = function() {
  query = {
    action:     'find',
    collection: 'candidates',
    matcher:    {name: 'Buster Keaton'},
    sort:       {name: 1}
  }
  bus.send('demo.mongo', query, function(msg) {
    if (msg['status'] === 'ok') {
      updateVotes( msg['results'][0] );
    } else {
      console.error('There was an error');
    }
  });
}

var updateVotes = function(record) {
  // generate a random but reasonable number of votes
  var votes = Math.ceil( Math.random() * 5 ) + record.votes;
  var update = {
    action: 'update',
    collection: 'candidates',
    criteria: {
      _id: record._id
    },
    objNew: {
      $set: {votes: votes}
    }
  }
  console.log("Changing Buster's votes from " + record.votes + " to " + votes);
  bus.publish('demo.mongo', update);
}

// get the mongo persistor running and fetch the mongo data
container.deployModule('io.vertx~mod-mongo-persistor~2.0.0-final', mongoConfig, hackElection);
