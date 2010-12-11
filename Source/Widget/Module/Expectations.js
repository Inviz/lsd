/*
---
 
script: Expectations.js
 
description: A trait that allows to wait for related widgets until they are ready
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Base

provides: [LSD.Widget.Module.Expectations]
 
...
*/

(function() {

var identifier = /^[a-z0-9-_]+$/

LSD.Widget.Module.Expectations = new Class({
  options: {
    events: {
      expectations: {
        self: {
          nodeInserted: function(widget) {
            var expectations = this.expectations;
            if (expectations) {
              var identifiers = expectations.identifiers, selectors = expectations.selectors;
              if (identifiers) for (var i = identifiers.length, identifier; identifier = identifiers[--i];) {
                if (identifier[0] == widget.identifier) {
                  identifier[1](widget);
                  identifiers.splice(i, 1);
                  expectations.count--;
                }
              }
              if (selectors) for (var i = selectors.length, selector; selector = selectors[--i];) {
                if (widget.match(selector[0])) {
                  selector[1](widget);
                  selectors.splice(i, 1);
                  expectations.count--;
                }
              }
              if (expectations.count) return;
            }  
            this.removeEvents(this.options.events.expectations)
          }
        }
      }
    }
  },
  
  initialize: function() {
    this.expectations = {
      selectors: [],
      identifiers: [],
      resolved: {},
      count: 0
    };
    this.parent.apply(this, arguments);
  },
  
  use: function() {
    var selectors = Array.from(arguments);
    var callback = selectors.pop();
    var expectations = this.expectations;
    selectors.each(function(selector) {
      if (selector.each) {
        this.use(selector.shift(), function(widget) {
          if (selector.length) widget.use(selector, callback)
          else callback(widget);
        });
      } else {
        var widget = expectations.resolved[selector];
        if (widget) return callback(widget);
        var simple = selector.match(identifier);
        widget = simple ? this[selector] : this.getElement(selector);
        if (!widget) {
          var type = simple ? 'identifiers' : 'selectors';
          expectations[type].push([selector, callback]);
          if (expectations.count == 0) this.addEvents(this.options.events.expectations);
          expectations.count++;
        }
      }
    }, this);
  },
  
  addEvents: function() {
    var events = this.parent.apply(this, arguments);
    if (events) Hash.each(events, function(value, key) {
      if (Widget.Events.Ignore.contains(key)) return;
      this.use(key, function(widget) {
        //console.log('got', key, value, widget.getSelector())
        widget.addEvents(value)
      })
    }, this);
    return events;
  },
  
  removeEvents: function() {
    var events = this.parent.apply(this, arguments);
    if (events) Hash.each(events, function(value, key) {
      if (Widget.Events.Ignore.contains(key)) return;
      var resolved = this.expectations.resolved[key];
      if (resolved) resolved.removeEvents(value);
    }, this);
    return events;
  }
  
});

Widget.Events.Ignore.push('expectations');

})();