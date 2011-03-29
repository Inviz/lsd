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
  - Ext/Class.Stateful
  - Ext/Class.mixin
  - Ext/FastArray
 
provides: 
  - LSD
 
...
*/

if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function() {};

var LSD = Object.append(new Events, {
  Events: {},
  Attributes: {
    Ignore: new FastArray,
    Numeric: new FastArray('tabindex', 'width', 'height')
  },
  Styles: {},
  States: {
    Known: {
      'built':    ['build', 'destroy', false],
      'attached': ['attach', 'detach', false],
      'dirty':    ['update', 'render', false],
      'hidden':   ['hide',    'show'],
      'disabled': ['disable', 'enable'],
      'focused':  ['focus',   'blur']
    },
    Positive: {
      disabled: 'disabled',
      focused: 'focused'
    },
    Negative: {
      enabled: 'disabled',
      blured: 'focused'
    },
    Attributes: new FastArray,
    Classes: {
      disabled: 'disabled',
      selected: 'selected'
    }
  },
  Layers: {
    shadow:     ['size', 'radius', 'shape', 'shadow'],
    stroke:     [        'radius', 'stroke', 'shape', 'fill'],
    background: ['size', 'radius', 'stroke', 'offset', 'shape', 'color'],
    foreground: ['size', 'radius', 'stroke', 'offset', 'shape', 'color'],
    reflection: ['size', 'radius', 'stroke', 'offset', 'shape', 'color'],
    icon:       ['size', 'scale', 'color', 'stroke', 'offset', 'shape', 'position','shadow'],
    glyph:      ['size', 'scale', 'color', 'stroke', 'offset', 'shape', 'position', 'shadow']
  },
  useNative: true
});

Object.append(LSD, {
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
  }(LSD.classnamed = {})
});