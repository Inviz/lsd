/*
---
 
script: Behaviour.js
 
description: Add events based on predefined list of selectors
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Widget.Base
 
provides: [LSD.Widget.Module.Behaviours]
 
...
*/

(function() {

  LSD.Widget.Module.Behaviours = new Class({
    addClass: function(name) {
      this.parent.apply(this, arguments);
      if (Classes[name]) Classes[name].each(function(behaviour) {
        if (this.match(behaviour[0])) {
          if (!this.behaviours) this.behaviours = {};
          if (!this.behaviours[name]) this.behaviours[name] = [];
          var events = this.bindEvents(behaviour[1]);
          this.behaviours[name].push(events);
          this.addEvents(events);
        }
      }, this);
    },
    
    removeClass: function() {
      this.parent.apply(this, arguments);
      if (this.behaviours && this.behaviours[name]) {
        this.behaviours[name].each(this.removeEvents.bind(this));
      }
    }
  });
  
  var Classes = LSD.Widget.Module.Behaviours.Classes = {};
  
  LSD.Widget.Module.Behaviours.define = function(selector, object) {
    var parsed = Slick.parse(selector).expressions[0][0].classes
    if (parsed) {
      var klass = parsed[0].value;
      if (!Classes[klass]) Classes[klass] = [];
      Classes[klass].push([selector, object]);
    } else {
      throw "Behaviour selector should contain atleast one class: " + selector
    }
  }

})();