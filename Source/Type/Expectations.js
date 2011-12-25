/*
---
 
script: Expectations.js
 
description: A trait that allows to wait for related \s until they are ready
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Module.Events
  - LSD.Module.Attributes
  - LSD.Module.Properties

provides: 
  - LSD.Module.Expectations
 
...
*/

!function() {
  
/**
  The best way to customize widget behavior, is to define a widget role. The role may be further extended or reused by widgets with the 
  matching tag name. But a widget can only have one role at time. There is a way to provide additional customizations to widget through 
  use of mixins, a reusable class definition that may be applied on top of the widget role. Both role and mixins are applied when the 
  widget matches specific condition. Widgets can find their role easily, because often the role name matches with the widget tag name, so 
  their condition would be a specific tag name. But mixins may also be triggered with any selector, for example, watching for a specific 
  pseudo class. LSD.Behavior is used to make mixin observe a selector, so every mixin comes with a pre-defined behavior. Behavior may be 
  also used to apply plain widget options, instead of mixins.        
 **/

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
  
LSD.Module.Expectations = LSD.Struct.Group({
  'pseudos': '.pseudos',
  'attributes': '.attributes',
  'classes': '.classes',
  'properties': '.properties',
  'document': '.document',
  'root': '.root',
});  
/*
  Expectation observes single selector expression. 
  
  Selector expression (e.g. `strong.important`) consists
  of a part that rarely changes in life time of a node
  (`strong` tag name) and another part that is dynamic
  (a class name `important` may be easily removed from 
  a node)
  
  The idea is to split the selector bit to static and dynamic
  parts. The widget that is *expect*ing the selector, groups
  his expectations by tag name. Every node inserted into
  that element or its children will pick up expectations
  related to it, thus matching static part of a selector
  - tag name and combinator. 
  
  Then, dynamic part kicks in - a node itself observes 
  the state and fires callbacks when classes, pseudo 
  classes or attributes are changed.
*/
LSD.Module.Expectations.implement({
  onChange: function(expression, callback, state, old, memo) {
    if (typeof expression == 'string') expression = Slick.parse(key).expressions[0][0];
    var storage = this.hash(expression);
    /*
      Selector without combinator,
      depends on state of current widget.
    */
    if (!expression.combinator || expression.combinator == '&') {
      for (var types = LSD.Module.Expectations._types, type, i = 0; type = types[i++];) {
        var values = selector[type];
        if (values) for (var j = 0, value; (value = values[j++]) && (value = value.key || value.value);) {
          if (state) {
            var kind = storage[type];
            if (!kind) kind = memo[type] = {};
            var group = kind[value];
            if (!group) group = kind[value] = [];
            group.push([selector, callback]);
          } else {
            var array = group[bit.key || bit.value];
            if (array) 
              for (var i = array.length; i--;)
                if (array[i][1] == callback || fn.callback == callback) 
                  array.splice(i, 1) && break;
          }
        }
      }
    } else {
      if (state) {
        if (!selector.structure) {
          var separated = separate(selector);
          selector.structure = { Slick: true, expressions: [[separated.structure]] }
          if (separated.state) selector.state = separated.state;
        }
        if (this.document && this.document.documentElement) this.getElements(selector.structure).each(function(widget) {
          if (selector.state) widget.expect(selector.state, callback);
          else callback.call(widget, widget, true);
        });
      } else {
        if (this.document) {
          if (!selector.structure) {
            var separated = separate(selector);
            selector.structure = { Slick: true, expressions: [[separated.structure]] }
            if (separated.state) selector.state = separated.state;
          }
          this.getElements(selector.structure).each(function(widget) {
            if (selector.state) widget.unexpect(selector.state, callback);
            if (iterator) iterator(widget)
          });
        }  
        var array = this.expectations[index][index == 'id' ? id : selector.tag];
        if (array) 
          for (var i = array.length; i--;)
            if (array[i][1] == callback || fn.callback == callback) 
              array.splice(i, 1) && break;
      }
    }
  },
  _hash: function(expression) {
    if (typeof expression == 'string') expression = LSD.Slick.parse(key).expressions[0][0];
    var storage = this._storage || (this._storage = {})
    var id = expression.id, tag = expression.tag, combinator = expression.combinator || ' '
    if (id && combinator == ' ') return (storage.id || (storage.id = {}))[id] || (storage.id[id] = [])
    else return (storage[combinator] || (storage[combinator] = {}))[tag] || (storage.id[tag] = []);
  },
  _remove: function(array, callback) {
  }
});

LSD.Module.Expectations._types = ['pseudos', 'classes', 'attributes'].




  
  
var Expectations = LSD.Module.Expectations = new Class({
  
  constructors: {
    expectations: function() {
      if (!this.expectations) this.expectations = {}
      else this.expectations = Object.clone(this.expectations)
      var self = this;
      this.properties.addEvent('change', function(name, value, state, old) {
        if (value && value.lsd) Expectations.relate(self, name, value, state);
        var property = Expectations.Properties[name];
        if (property) property.call(self, value, state);
      }).addEvent('beforechange', function(name, value, state) {
        if (value.lsd) Expectations.relate(self, name, value, state);
        var property = Expectations.Properties[name];
        if (property) property.call(self, value, state);
      })
    }
  },
  
  getElementsByTagName: function(tag) {
    return (this.expectations.tag && this.expectations.tag[LSD.toLowerCase(tag)]) || [];
  },
  
});

Expectations.relate = function(object, name, subject, state) {
  if (state) {
    var expectations = subject.expectations;
    if (expectations) {
      var type = expectations['!::'];
      if (!type) type = expectations['!::'] = {};
      var group = type[name];
      if (!group) group = type[name] = [];
      group.push(object);
      notify.call(object, '::', name, true, subject);
    }
  } else {
    var expectations = subject.expectations;
    if (expectations) {
      notify.call(object, '::', name, false, subject);
      subject.expectations['!::'][name].erase(object);
    }
  }
};


var check = function(type, value, state, target) {
  for (var expectations = this.expectations; expectations;) {
    var subject = target, group = expectations;
    if (!subject) {
      group = group.self;
      subject = this;
    }
    group = group && group[type] && group[type][value];
    if (group) for (var i = 0, expectation; expectation = group[i++];) {
      var selector = expectation[0];
      if (selector.structure && selector.state) {
        if (subject.match(selector.structure)) {
          if (!state) {
            if (subject.match(selector.state)) {
              subject.unexpect(selector.state, expectation[1]);
              expectation[1](subject, !!state)
            }
          } else subject.expect(selector.state, expectation[1])
        }
      } else if (subject.match(selector)) {
        expectation[1].call(this, subject, !!state)
      }
    }
    if (expectations == this.expectations) expectations = Expectations.Default;
    else break;
  }
};

var notify = function(type, tag, state, widget, single) {
  check.call(this, type, tag, state, widget);
  if (!single && type != '::') check.call(this, type, '*', state, widget);
};

var update = function(widget, tag, state, single) {
  notify.call(this, ' ', tag, state, widget, single);
  var options = widget.options, id = widget.id;
  if (id) check.call(this, 'id', id, state, widget);
  if (this.previousSibling) {
    notify.call(this.previousSibling, '!+', widget.tagName, state, widget, single);
    notify.call(this.previousSibling, '++', widget.tagName, state, widget, single);
    for (var sibling = this; sibling = sibling.previousSibling;) {
      notify.call(sibling, '!~', tag, state, widget, single);
      notify.call(sibling, '~~', tag, state, widget, single);
    }
  }
  if (this.nextSibling) {
    notify.call(this.nextSibling, '+',  tag, state, widget, single);
    notify.call(this.nextSibling, '++', tag, state, widget, single);
    for (var sibling = this; sibling = sibling.nextSibling;) {
      notify.call(sibling, '~',  tag, state, widget, single);
      notify.call(sibling, '~~', tag, state, widget, single);
    }
  }
  if (widget.parentNode == this) notify.call(this, '>', widget.tagName, state, widget, single);
}


var separate = function(selector) {
  if (selector.state || selector.structure) return selector
  var separated = {};
  for (var criteria in selector) {
    switch (criteria) {
      case 'tag': case 'combinator': case 'id':
        var type = 'structure';
        break;
      default:
        var type = 'state';
    }
    var group = separated[type];
    if (!group) group = separated[type] = {};
    group[criteria] = selector[criteria]
  };
  return separated;
};

Expectations.events = {
  selectorChange: check,
  nodeInserted: function(widget) {
    var expectations = this.expectations, type = expectations.tag, tag = widget.tagName;
    if (!type) type = expectations.tag = {};
    var group = type[tag];
    if (!group) group = type[tag] = [];
    group.push(widget);
    group = type['*'];
    if (!group) group = type['*'] = [];
    group.push(widget);
    update.call(this, widget, tag, true);
  },
  nodeRemoved: function(widget) {
    var expectations = this.expectations, type = expectations.tag, tag = widget.tagName;
    if (tag) type[tag].erase(widget);
    type['*'].erase(widget);
    update.call(this, widget, tag, false);
  },
  nodeTagChanged: function(widget, tag, old) {
    var expectations = this.expectations, type = expectations.tag;
    var index = type[old].indexOf(widget);
    if (index == -1) return;
    type[old].splice(index, 1);
    update.call(this, widget, old, false);
    if (!tag) return;
    var group = type[tag];
    if (!group) group = type[tag] = [];
    group.push(widget);
    update.call(this, widget, tag, true);
  },
  tagChanged: function(tag, old) {
    check.call(this, 'tag', old, false);
    if (tag) check.call(this, 'tag', tag, true);
    if (old && this.parentNode && !this.removed) this.parentNode.dispatchEvent('nodeTagChanged', [this, tag, old]);
  }
};

Expectations.Properties = {
  parent: function(value, state, old, memo) {
    notify.call(this, '!>', value.tagName, false, value);
    for (var parent = value; parent; parent = parent.parentNode) notify.call(this, '!', parent.tagName, state, parent);
  }
};

LSD.Module.Events.addEvents.call(Expectations.prototype, Expectations.events);


}();