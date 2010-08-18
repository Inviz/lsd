ART.Widget.Trait.Aware = new Class({
  
  use: function() {
    var selectors = $A(arguments);
    var callback = selectors.getLast().call ? selectors.pop() : $empty;
    var resolved = [];
    var remove = function(selector, widget) {
      selectors.erase(selector);
      resolved.push(widget);
      if (selectors.length == 0) callback.apply(this, resolved);
    }.bind(this);
    selectors.each(function(selector) {
      var check = function(widget) {
        if (widget.match(selector)) widget.onDOMInject(function() { 
          remove(selector, widget)
        });
      };
      (this.descendants || []).each(check);
      this.addEvent('hello', check);
    }, this)
  },
  
  attach: Macro.onion(function() {
    this.descendants = [];
    this.addEvent('hello', function(widget) {
      this.descendants.push(widget)
    }.bind(this));
  })
  
});
