// Our backbone.js model
var Candidate = Backbone.Model.extend({
});

// The backbone.js collection
var Ballot = Backbone.Collection.extend({
  model: Candidate,
    // The event bus address for mongo
    url: 'demo.candidates'
});

// The model's view
var CandidateView = Backbone.View.extend({

  // use underscore.js templating
  template: _.template($('#candidate-template').html()),

  className: "candidate",

  // respond to click events and keypresses
  events: {
      'click .headshot': 'incrementVotes',
    'keypress .comment': 'updateOnEnter'
  },

  initialize: function() {
    // listen to the model for changes and render
    this.listenTo(this.model, 'change', this.render);
    this.$el.html(this.template(this.model.attributes));
  },

  render: function() {
    var changes = this.model.changedAttributes();
    if (changes['votes']) {
      this.$('.votes').html(changes['votes']);
    }
    if (changes['comments']) {
      list = this.$('.comments');
      list.empty();
      _.each(this.model.get('comments'), function(comment) {
        list.append('<li>'+comment+'</li>');
      });
    }
    return this;
  },

  // responds to a click on the headshot
  incrementVotes: function() {
    this.model.set({votes: this.model.get('votes') + 1});
    Backbone.sync('update', this.model);
  },

  // responds to keypresses
  updateOnEnter: function(e) {
    if (e.keyCode ==13) this.addComment();
  },

  // update the model with the new comment
  addComment: function() {
    var comment = this.$('.comment').val();
    if (comment) {
      comments = this.model.get('comments').slice();
      comments.push(comment);
      this.model.set('comments', comments);
      Backbone.sync('update', this.model);
      this.$('.comment').val("");
    }
  },
});


