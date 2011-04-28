/*
---
 
script: Events.js
 
description: A mixin that adds support for declarative events assignment
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - Core/Events
  - Core/Element.Event
  - More/Element.Delegation
  - More/Events.Pseudos
  - Ext/Element.Properties.widget

provides:
  - LSD.Module.Events

...
*/

/*
  The module takes events object defined in options
  and binds all functions to the widget.

  Ready to use event tree can be accessed via
  *.events* accessor. 
*/

LSD.Module.Events = new Class({
  options: {
    states: Array.fast('attached')
  },
  
  initializers: {
    events: function() {
      return {
        events: {
          'destroy': 'detach',
          'build': 'attach'
        }
      }
    }
  },
  
  bindEvents: function(tree) {
    if (!tree || tree.call) return tree;
    if (!this.$bound) this.$bound = {}
    if (tree.indexOf) {
      var args, self = this
      if (tree.map) {
        args = tree.splice(1);
        tree = tree[0];
      }
      if (!this.$bound[tree]) {
        this.$bound[tree] = function() {
          if (self[tree]) self[tree].apply(self, args || arguments);
        }
      }
      return this.$bound[tree];
    }
    var result = {}
    for (var i in tree) result[i] = this.bindEvents(tree[i]);
    return result;
  }
});


/*
  Target system re-routes event groups to various objects.  
  
  Combine them for fun and profit.
  
  | Keyword    |  Object that recieves events       |
  |-------------------------------------------------|
  | *self*     | widget itself (no routing)         |
  | *element*  | widget element (when built)        |
  | *parent*   | parent widget                      |
  | *document* | LSD document                       |
  | *window*   | window element                     |
  
  | State      | Condition                          |
  |-------------------------------------------------|
  | *enabled*  | widget is enabled                  |
  | *disabled* | widget is disabled                 |
  | *focused*  | widget is focused                  |
  | *blured*   | widget is blured                   |
  | *target*   | first focusable parent is focused  |
  
  | Extras     | Description                        |
  |-------------------------------------------------|
  | *expected* | Routes events to widgets, selected |
  |            | by selectors (keys of event group).|
  |            | Provided by Expectations module    |
  | _\w        | An event group which name starts   |
  |            | with underscore is auto-applied    |
                 
                 
  
  
  Advanced example:
  
  events: {
    self: {
      focus: 'onFocus'
    },
    window: {
      resize: 'onWindowResize'
    },
    parent: {
      element: { //event delegation
        'click:relay(.button)': 'onButtonClick' 
      }
    },
    expected: { 
      'button:first-child': { //waits for widgets
        parent: {}
      }
    }
  }
*/

LSD.Module.Events.Promise = function() {
  this.events = {}
}
LSD.Module.Events.Promise.prototype = {
  addEvents: function(events) {
    for (var name in events) {
      var group = this.events[name]
      if (!group) group = this.events[name] = [];
      group.push(events[name]);
    }
  },
  
  removeEvents: function(events) {
    for (var name in events) {
      var group = this.events[name]
      if (group) group.erase(events[name]);
    }
  },
  
  realize: function(object) {
    for (var name in this.events) for (var i = 0, fn; fn = this.events[name][i++];) object.addEvent(name, fn);
  }
}

LSD.Module.Events.Targets = {
  self: function() { 
    return this
  },
  element: function() { 
    if (this.element) return this.element;
    var promise = this.$events.$element;
    if (!promise) {
      promise = this.$events.$element = new LSD.Module.Events.Promise
      this.addEvent('build', function() {
        promise.realize(this.element)
      });
    }
    return promise;
  },
  window: function() {
    return window;
  },
  document: function() {
    return this.document;
  },
  parent: function() {
    var self = this, watchers = this.watchers, group;
    var listeners = {
      inject: function(widget) {
        if (widget instanceof LSD.Widget) widget.addEvents(group);
      },    
      dispose: function(widget) {
        if (widget instanceof LSD.Widget) widget.removeEvents(group);
      }
    };
    return {
      addEvents: function(events) {
        group = events;
        self.addEvents(listeners);
        if (self.parentNode) listeners.inject(self.parentNode);
      },
      
      removeEvents: function(events) {
        group = events;
        self.removeEvents(listeners);
        if (self.parentNode) listeners.dispose(self.parentNode);
      }
    }
  },
  mobile: function() {
    return this;
  }
};

!function(Events, Known, Positive, Negative) {
  Object.each(Object.append({}, Positive, Negative), function(state, name) {
    var positive = !!Positive[name];
    LSD.Module.Events.Targets[name] = function() {
      var self = this, setting = Known[state], group;
      var add     = function() { self.addEvents(group);   }
      var remove = function() { self.removeEvents(group) }
      return {
        addEvents: function(events) {
          group = events;
          if (positive ^ !self[state]) add.call(this);
          self.addEvent(setting[positive ? 'enabler' : 'disabler'], add);
          self.addEvent(setting[!positive ? 'enabler' : 'disabler'], remove);
        },
        removeEvents: function(events) {
          group = events;
          if (positive ^ self[state]) remove.call(this);
          self.removeEvent(setting[!positive ? 'enabler' : 'disabler'], add);
          self.removeEvent(setting[positive ? 'enabler' : 'disabler'], remove);
        }
      }
    }
  });
}(LSD.Module.Events, LSD.States.Known, LSD.States.Positive, LSD.States.Negative)

/* 
  
*/

LSD.Module.Events.target = function(self, name) {
  if (name.charAt(0) == "_") return true;
  var target = LSD.Module.Events.Targets[name];
  if (!target) return;
  return target.call(self)
}

/*
  Defines special *on* pseudo class for events used for
  event delegation. The difference between usual event 
  delegation (which is :relay in mootools) and this, is
  that with :on you can use LSD selectors and it fires 
  callbacks in context of widgets.
  
  element.addEvent('mouseover:on(button)', callback)
*/

Event.definePseudo('on', function(split, fn, args){
  var event = args[0];
  var widget = Element.get(event.target, 'widget');
  if (widget && widget.match(split.value)) {
    fn.call(widget, event, widget, event.target);
    return;        
  }
});