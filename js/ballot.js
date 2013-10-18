// Use the vertx event bus to synchronize our models
var eb = new vertx.EventBus('http://localhost:8080/eventbus');

eb.onopen = function() {
  var ballot = new Ballot(); 

  // Once the event bus is ready, setup our model synchronization
  Backbone.sync = function(method, model) {

    // gets all the records for this collection
    if (method === 'read') {

      // the mongo query for getting all candidates
      var query = {
        'action': 'find',
        'collection': 'candidates',
        'sort': { name: 1 },
        'matcher': {}
      }

      // sends a message over the event bus to get records from mongo
      eb.send(model.url, query, function(msg, replier) {
        if (msg['status'] == 'ok') { 

          // Iterate over the results, massage, and add to the backbone.js collection
          _.each(msg['results'], function(record) {

            // Set an id property for backbone
            record.id = record._id;

            // create the backbone model and add it to the ballot
            var candidate = new Candidate(record);
            ballot.add(candidate);

            // If changes happen elsewhere, get notified by the bus
            eb.registerHandler(candidate.url(), function(msg) {
              // update the local model with changes sent
              candidate.set(msg);
            });

            // Display with the HTML template
            var view = new CandidateView({model: candidate});
            $('#candidate-list').append(view.render().el);
          });
        } else { alert("There was an error loading the ballot: " + msg['message']); }
      });
    } 
    else if (method === 'update') {
      // publish the change to the event bus
      eb.publish(model.url(), model.changedAttributes());

      // update mongo
      var update = {
        action: 'update',
        collection: 'candidates',
        criteria: {
          name: model.get('name')
        },
        objNew: {
          $set: model.changedAttributes()
        }
      }
      eb.publish(ballot.url, update);
    }
  }

  ballot.fetch();
}

