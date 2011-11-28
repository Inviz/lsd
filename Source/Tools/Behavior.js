/*
---
 
script: Behavior.js
 
description: Defines global selectors that mix the mixins in
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  
provides:
  - LSD.Behavior
  
...
*/

LSD.Behavior = function() {
  this.attached = [];
  this.expectations = {};
}

/**
  The best way to customize widget behavior, is to define a widget role. The role may be further extended or reused by widgets with the 
  matching tag name. But a widget can only have one role at time. There is a way to provide additional customizations to widget through 
  use of mixins, a reusable class definition that may be applied on top of the widget role. Both role and mixins are applied when the 
  widget matches specific condition. Widgets can find their role easily, because often the role name matches with the widget tag name, so 
  their condition would be a specific tag name. But mixins may also be triggered with any selector, for example, watching for a specific 
  pseudo class. LSD.Behavior is used to make mixin observe a selector, so every mixin comes with a pre-defined behavior. Behavior may be 
  also used to apply plain widget options, instead of mixins.        
 **/

LSD.Behavior.prototype = {
  /**
    Provides additional behavor for LSD Widgets. 

    There are several ways to define a new behavior (commands). For a complete list of commands, refer Widget guide.
        
    As pseudo:

      LSD.Behavior.define(':submittable', 'submittable')
    
    As pseudo containing certain attributes:

      LSD.Behavior.define(':form[acttion], [src], [href]', 'request')
    
    As an object containing certain attributes

      LSD.Behavior.define('[scrollable]', 'scrollable')

    Submitable, Request and Scrollable in the given examples are retrieved from LSD.Mixin object (they are LSD.Mixin.Submitable, LSD.Mixin.Request,
    LSD. Mixin.Scrollable).

    You can also specify a concerete class:

      LSD.Behavior.define('[scrollable]', LSD.Mixin.Scrollable)

   **/
  define: function(selector, behavior) {
    selector.split(/\s*,\s*/).each(function(bit) {
      var group = this.expectations[bit];
      if (!group) group = this.expectations[bit] = [];
      group.push(behavior);
      this.attached.each(function(object) {
        this.expect(object, bit, behavior)
      }, this);
    }, this);
  },
  
  expect: function(object, selector, behavior) {
    var proto = object.prototype, type = typeOf(behavior);
    var watcher = function(widget, state) {
      if (type == 'object') widget[state ? 'setOptions' : 'unsetOptions'](behavior);
      else if (type == 'function') behavior(widget, state)
      else widget[state ? 'mixin' : 'unmix'](behavior, true);
    }
    if (proto.expect) {
      var parsed = Object.clone(LSD.Slick.parse(selector).expressions[0][0]);
      delete parsed.combinator;
      proto.expect(parsed, watcher);
    }
  },
  
  attach: function(object) {
    this.attached.push(object);
    for (var expectation in this.expectations) 
      for (var exps = this.expectations[expectation], i = 0, exp; exp = exps[i++];)
        this.expect(object, expectation, exp);
  }
};

LSD.Behavior = new LSD.Behavior;