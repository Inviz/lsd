/*
---
 
script: Options.js
 
description: A module that sets and unsets various options stuff
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module.Attributes
  - LSD.Module.Events
  - LSD.Module.Shortcuts
  - LSD.Module.Styles

provides:
  - LSD.Module.Events

...
*/

LSD.Module.Options = new Class({
  Implements: [LSD.Module.Attributes, LSD.Module.Events, LSD.Module.Shortcuts, LSD.Module.Styles, Shortcuts],
  
  setOptions: function(options, remove) {
    for (var name in options) {
      var value = options[name], setter = LSD.Options[name];
      if (setter) {
        if (setter.process) {
          value = (setter.process.charAt ? this[setter.process] : setter.process)(value);
        }
        var mode = remove ? 'remove' : 'add';
        var method = setter[mode];
        if (method.charAt) method = this[method];
        if (setter.iterate) {
          if (value.each) for (var i = 0, j = value.length; i < j; i++) method.call(this, value[i]);
          else for (var i in value) method.call(this, i, value[i])
        } else method.call(this, value);
      }
    }
  },
  
  unsetOptions: function(options) {
    return this.setOptions(options, true)
  }
});




Object.append(LSD.Options, {
  attributes: {
    add: 'setAttribute',
    remove: 'removeAttribute',
    iterate: true
  },
  classes: {
    add: function(name) {
      this[LSD.States.Classes[name] ? 'addPseudo' : 'addClass'](name);
    },
    remove: function(name) {
      this[LSD.States.Classes[name] ? 'removePseudo' : 'removeClass'](name);
    },
    iterate: true
  },
  pseudos: {
    add: function(name) {
      if (this.$states[value]) this.setStateTo(value, true);
      else this.addPseudo(value);
    },
    remove: function(name) {
      if (this.$states[value]) this.setStateTo(value, false);
      else this.removePseudo(value);
    },
    iterate: true
  },
  actions: {
    add: 'addAction',
    remove: 'removeAction',
    iterate: true
  },
  events: {
    add: 'addEvents'
    remove: 'removeEvents'
    process: 'bindEvents'
  },
  shortcuts: {
    add: 'addShortcut',
    remove: 'removeShortcut',
    process: 'bindEvents',
    events: {
      focus: 'enableShortcuts',
      blur: 'disableShortcuts'
    }
  },
  states: {
    add: 'addStates',
    remove: 'removeStates'
  },
  styles: {
    add: 'setStyles',
    remove: 'unsetStyles'
  },
  relations: {
    add: 'addRelation',
    remove: 'removeRelation',
    process: function(has) {
      var one = has.one, many = has.many, relations = {};
      if (one) for (var name in one) relations[name] = one[name];
      if (many) for (var name in many) relations[name] = Object.append(many[name], {multiple: true});
      return relations;
    },
    iterate: true
  },
  proxies: {
    add: 'addProxy',
    remove: 'removeProxy',
    iterate: true
  },
  layers: {
    add: 'addLayer',
    remove: 'removeLayer',
    iterate: true
  },
  layout: {
    add: 'setLayout',
    options: {
      transform: {
        add: 'addLayoutTransformation',
        remove 'removeLayoutTransformation',
        events: {
          'layoutTransform': 'onLayoutTransform'
        }
      }
    }
  }
});