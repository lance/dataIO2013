var Candidate = Backbone.Model.extend({ 
});

var Ballot = Backbone.Collection.extend({
  model: Candidate
});

var CandidateView = Backbone.View.extend({
  events: {
    "click .headshot" : "incrementVotes",
    "keypress .comment" : "updateOnEnter",
  },

  template: _.template($('#candidate-template').html()),

  initialize: function() {
    this.listenTo(this.model, "change", this.render);
  },

  render: function() {
    if (this.model.hasChanged("votes")) {
      // Don't update the entire template for a simple vote
      // TODO: do the same for comments
      this.$('.votes').html(this.model.get('votes'));
    } else {
      this.$el.html(this.template(this.model.attributes));
    }
    return this;
  },

  incrementVotes: function() {
    this.model.set({votes: this.model.get('votes') + 1});
  },

  addComment: function() {
    var comment = this.$('.comment').val();
    if (comment) {
      this.model.get('comments').push(comment);
      this.model.trigger("change");
    }
  },

  updateOnEnter: function(e) {
    if (e.keyCode ==13) this.addComment();
  }
});

var ballot = new Ballot([ 
  new Candidate({_id: "0", name: "Marcel Marceau", image: "/images/marceau.jpg", votes: 0, comments: []}),
  new Candidate({_id: "1", name: "Charlie Chaplin", image: "/images/chaplin.jpg", votes: 0, comments: []}),
  new Candidate({_id: "2", name: "Buster Keaton", image: "/images/keaton.gif", votes: 0, comments: []})
]);

var eb = new vertx.EventBus("http://localhost:8080/eventbus");

eb.onopen = function() {

  ballot.each(function(model) {

    // Display each candidate with the HTML template
    var view = new CandidateView({model: model});
    $("#candidate-list").append(view.render().el);

    // Create a unique event bus address for each model based on its id
    var id = 'demo.candidate.' + model.get('_id');

    // When a model changes, send that change over the bus
    model.on('change', function() {
      // send our changes to the event bus
      eb.publish(id, model);
    });

    // If changes happen elsewhere, get notified by the bus
    eb.registerHandler(id, function(msg) {
      // update the local model with what's on the bus
      model.set(msg);
    });
  });
}
