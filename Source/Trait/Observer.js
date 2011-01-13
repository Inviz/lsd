/*
---
 
script: Observer.js
 
description: A wrapper around Observer to look for changes in input values
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
  - Ext/Observer
 
provides: 
  - LSD.Trait.Observer
  - Class.Mutators.States
 
...
*/


LSD.Trait.Observer = new Class({
  
  options: {
    observer: {
      periodical: 200,
      delay: 50
    },
    events: {
      _observer: {
        self: {
          focus: function() {
            this.getObserver().resume()
          },
          blur: function() {
            this.getObserver().pause()
          }
        }
      }
    }
  },
  
  getObserver: Macro.getter('observer', function() {
    return new Observer(this.getObservedElement(), this.onChange.bind(this), this.options.observer)
  }),
  
  getObservedElement: Macro.defaults(function() {
    return this.element;
  }),
  
  onChange: function(value) {
    if (value.match(/^\s*$/)) {
      this.empty();
    } else {
      this.fill.apply(this, arguments);
    }
  }
});

LSD.Trait.Observer.State = Class.Stateful({
  'filled': ['fill', 'empty']
});
LSD.Trait.Observer.Stateful = [
  LSD.Trait.Observer.State,
  LSD.Trait.Observer
];