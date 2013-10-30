// Use the vertx event bus to synchronize our models
var bus = new vertx.EventBus('http://localhost:8080/eventbus');
bus.mongoAddress = 'demo.mongo';

// Send a message to mongo on the event bus fetching all the records.
var readCollection = function(bus, collection, options) {
  var query = {
    action: 'find',
    collection: collection.name,
    matcher: {}
  }
  if (options.sort) {
    query.sort = options.sort;
  }
  if (options.matcher) {
    query.matcher = options.matcher;
  }
  bus.send(bus.mongoAddress, query, function(msg) {
    if (msg['status'] == 'ok') { 
      var collection = msg['results'];
      _.each(collection, function(record) {
        // add the mongo data to our backbone model collection
        var modelRecord = convertToBackbone(ballot, record);

        // Listen to the event bus for changes to this model
        console.log(['Registering handler for', modelRecord.url()].join(' '));
        bus.registerHandler(modelRecord.url(), function(msg) {
          modelRecord.set(msg);
        });
      });
    } else { alert("There was an error loading the collection: " + msg['message']); }
  });
}

// Converts mongo candidate records to backbone models
var convertToBackbone = function(collection, record) {
  record.id = record._id;
  ballot.add(record);
  return ballot.last();;
}

// Publish any changed model attributes to the event bus
var publishModelUpdate = function(bus, model) {
  // notify listeners of  individual model changes
  bus.publish(model.url(), model.changedAttributes());

  // a mongodb update message
  var update = {
    action: 'update',
    collection: model.collection.name,
    criteria: {
      _id: model.id
    },
    objNew: {
      $set: model.changedAttributes()
    }
  }
  // publish the changes to the event bus, persisting to mongo
  bus.publish(bus.mongoAddress, update);
}

/**
 * mongoBackbone can be used to synchronize backbone.js models with
 * a mongodb instance exposed over the vertx event bus. 
 * Caution this is not safe to use in real life. 
 */
var mongoBackbone = function(bus) {
  /**
   * Synchronizes the model based on the method provided.
   * @param {string} method The synch method (read or update)
   * @param {{}} model The backbone.js model to synchronize.
   *        This may be a collection or individual model.
   * @param {{}} options Mongodb query options
   */
  return function(method, model, options) {
    // Reads a model or collection from mongo using the event bus..
    if (method === 'read') {
      readCollection(bus, model, options);
    } 
    else if (method === 'update') {
      publishModelUpdate(bus, model);
    }
  }

}

// The backbone.js collection of candidate records
var Ballot = Backbone.Collection.extend({
  // The colleciton name in mongo
  name: 'candidates',

  // The backbone.js url
  url: '/candidates'
});
var ballot = new Ballot(); 

bus.onopen = function() {

  // Once the event bus is ready, setup model sync
  Backbone.sync = mongoBackbone(bus)

  // As models are added to the collection, display them with the view
  ballot.on('add', function(candidate) {
    $('#candidate-list').append(new CandidateView({model: candidate}).render().el);
  });

  // Get all of the models and load them into our collection
  ballot.fetch({sort: {name: 1}});
}

