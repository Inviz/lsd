(function() {
ART.Widget.Module.LayoutEvents = new Class({
  
  addEvents: Macro.onion(function(events) {
    this.attachLayoutEvents(this.parent.apply(this, arguments));
  }),
  
  attachLayoutEvents: function(events) {
		var callbacks = {};
		var walk = function(tree, prefix) {
		  if (!prefix) prefix = '';
  		for (var type in tree) {
  		  var event = tree[type];
  		  if (ART.Widget.Ignore.events.contains(type)) continue;
  		  if (event.call) {
  		    if (!prefix) continue;
  		    if (!callbacks[prefix]) callbacks[prefix] = {};
  		    callbacks[prefix][type] = event;
		    } else {
    		  walk(tree[type], ((prefix.length ? (prefix + ' ') : '') + '#' + type)); 
		    }
		  }
		}.bind(this);
		walk(this.bindEvents(events));
	  Hash.each(callbacks, function(events, selector) {
  	  this.use(selector, function(widget) {
  	    widget.addEvents(events);
  	  }.bind(this))
	  }, this);
  }
});


})();

ART.Widget.Ignore.events.push('self', 'element', 'parent');