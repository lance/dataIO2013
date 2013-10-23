// Use the vertx event bus to synchronize our models
var bus = new vertx.EventBus('http://localhost:8080/eventbus');

/**
 * MongoBackbone can be used to synchronize backbone.js models with
 * a mongodb instance exposed over the vertx event bus. Caution this
 * is not really safe to use in real life. You'll want to have better
 * security over what's allowed over the bus.
 * @constructor
 */
var MongoBackbone = function(bus) {

  /**
   * Synchronizes the model based on the method provided.
   * Currently only read and update are supported.
   * @param {string} method The synch method (read or update)
   * @param {{}} model The backbone.js model to synchronize.
   *        This may be a collection or individual model.
   * @param {{}} options Mongodb query options
   */
  this.sync = function(method, model, options) {
    
    // Reads a model or collection from mongo using the event bus..
    if (method === 'read') {

      bus.send(model.url, _constructReadQuery(model, options), function(msg) {
        if (msg['status'] == 'ok') { 

          // Iterate over the results and add to the collection
          _.each(msg['results'], function(record) {

            // Set an id property for backbone and
            // add the record to the collection model
            record.id = record._id;
            model.add(record);
            var modelRecord = model.last();

            // Set the record's urlRoot. This will be used as
            // the event bus address to send and receive updates
            // for changes to the model state.
            modelRecord.urlRoot = model.url;

            // Register a handler on the event bus for the new record. 
            // When changes are made to the record elsewhere, our handler 
            // will be called and the model can be updated locally.
            bus.registerHandler(modelRecord.url(), function(msg) {
              modelRecord.set(msg);
            });

          });
        } else { alert("There was an error loading the collection: " + msg['message']); }
      });
    } 
    else if (method === 'update') {
      // The model has been changed locally. Publish changes to the 
      // vertx event bus, informing all clients who have subscribed
      // to the model's address on the vertx bus this model has changed.
      bus.publish(model.url(), model.changedAttributes());

      // update mongo via the mongo channel on the vertx event bus
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
      // publish the changes to the mongodb address
      // on the event bus, ensuring that they are persisted
      bus.publish(model.urlRoot, update);
    }
  }

  /**
   * @private
   */
  var _constructReadQuery = function(model, options) {
    var query = {
      action: 'find',
      collection: model.name,
      matcher: {}
    }
    if (options.sort) {
      query.sort = options.sort;
    }
    if (options.matcher) {
      query.matcher = options.matcher;
    }
    return query;
  }

}

// The backbone.js collection of candidate records
var Ballot = Backbone.Collection.extend({
  // The event bus address for mongo
  url: 'demo.mongo',
  // The colleciton name in mongo
  name: 'candidates'
});
var ballot = new Ballot(); 

bus.onopen = function() {
  var mongoBackbone = new MongoBackbone(bus);

  // Once the event bus is ready, setup our model synchronization
  Backbone.sync = mongoBackbone.sync;

  // As models are added to the collection, display them with the view
  ballot.on('add', function(candidate) {
    $('#candidate-list').append(new CandidateView({model: candidate}).render().el);
  });

  // Get all of the models and load them into our collection
  ballot.fetch({sort: {name: 1}});
}

