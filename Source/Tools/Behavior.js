/*
---

script: Behavior.js

description: Defines global selectors that mix the mixins in

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD
  - Slick/Slick.Parser

provides:
  - LSD.Behavior

...
*/

LSD.Behavior = function() {
  this.attached = [];
  this.expectations = {};
}

LSD.Behavior.prototype = {
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
      else widget[state ? 'mixin' : 'unmix'](behavior, true);
    }
    if (proto.expect) {
      var parsed = Object.clone(Slick.parse(selector).expressions[0][0]);
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