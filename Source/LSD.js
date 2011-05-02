/*
---
 
script: LSD.js
 
description: LSD namespace definition
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - Core/Class
  - Core/Events
  - Core/Options
  - Core/Browser
  - Core/Object
  - Ext/Macro
  - Ext/States
  - Ext/Class.mixin
  - Ext/FastArray
  - Ext/Class.Mutators.Includes
 
provides: 
  - LSD
 
...
*/

if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function() {};

var LSD = Object.append(new Events, {
  Events: {},
  Attributes: {
    Numeric: Array.fast('tabindex', 'width', 'height'),
    Boolean: Array.fast('readonly', 'disabled', 'hidden')
  },
  Styles: {},
  States: {
    Known: {
      built:    {enabler: 'build',    disabler: 'destroy',   reflect: false},
      attached: {enabler: 'attach',   disabler: 'detach',    reflect: false},
      hidden:   {enabler: 'hide',     disabler: 'show'},     
      disabled: {enabler: 'disable',  disabler: 'enable'},   
      focused:  {enabler: 'focus',    disabler: 'blur'},     
      selected: {enabler: 'select',   disabler: 'unselect'}, 
      checked:  {enabler: 'check',    disabler: 'uncheck',   toggler: 'toggle'},
      expanded: {enabler: 'expand',   disabler: 'collapse',  toggler: 'toggle'},
      working:  {enabler: 'busy',     disabler: 'idle'},
      chosen:   {enabler: 'choose',   disabler: 'forget'},
      empty:    {enabler: 'empty',    disabler: 'fill',      property: 'unfilled'}
    },
    Positive: {
      disabled: 'disabled',
      focused: 'focused'
    },
    Negative: {
      enabled: 'disabled',
      blured: 'focused'
    },
    Attributes: {
      disabled: 'disabled',
      hidden: 'hidden'
    },
    Classes: {
      selected: 'selected'
    }
  },
  Options: {},
  useNative: true
});

Object.append(LSD, {
  position: function(box, size, x, y) {
    var position = {x: 0, y: 0};

    switch (x) {
      case "left":
        position.x = 0;
      case "right":
        position.x = box.width - size.width;
      case "center":
        position.x = (box.width - size.width) / 2;
    }
    switch (y) {
      case "top":
        position.y = 0;
      case "bottom":
        position.y = box.height - size.height;
      case "center":
        position.y = (box.height- size.height) / 2;
    }
    return position;
  },
  
  toLowerCase: function(lowercased) {
    return function(string) { 
      return (lowercased[string]) || (lowercased[string] = string.toLowerCase())
    }
  }(LSD.lowercased = {}),
  
  capitalize: function(capitalized) {
    return function(string) {
      return (capitalized[string]) || (capitalized[string] = string.capitalize())
    }
  }(LSD.capitalized = {}),
  
  toClassName: function(classnamed) {
    return function(string) {
      return (classnamed[string]) || (classnamed[string] = string.replace(/(^|-)([a-z])/g, function(a, b, c) { return (b ? '.' : '') + c.toUpperCase()}))
    }
  }(LSD.classnamed = {}),
  
  uid: function(object) {
    if (object.lsd) return object.lsd;
    if (object.localName) return $uid(object);
    return (object.lsd = ++LSD.UID); 
  },
  
  UID: 0
});


States.get = function(name) { 
  return LSD.States.Known[name];
}