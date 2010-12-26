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
- Ext/Macro
- Ext/Class.Stateful
- ART
 
provides: [Exception, $equals, LSD]
 
...
*/

if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function() {};

(function() {
  
  var toArgs = function(args, strings) {
    var results = [];
    for (var i = 0, arg; arg = args[i++];) {
      switch(typeOf(arg)) {
        case "hash":
          if (strings) arg = JSON.encode(arg);
          break;
        case "element":
          if (strings) {
            var el = arg.get('tag');
            if (arg.get('id')) el += "#" + arg.get('id');
            if (arg.get('class').length) el += "." + arg.get('class').replace(/\s+/g, '.');
            arg = el;
          }
          break;
        default: 
          if (strings) {
            if (typeof arg == 'undefined') arg = 'undefined';
            else if (!arg) arg = 'false';
            else if (arg.name) arg = arg.name;
        
            if (typeOf(arg) != "string") {
              if (arg.toString) arg = arg.toString();
              if (typeOf(arg) != "string") arg = '[Object]'
            }
          }
      }
      
      results.push(arg)
    }
    
    return results;
  };
  
  var toString = function(args) {
    return toArgs(args, true).join(" ")
  }

  Exception = new Class({
    name: "Exception",

    initialize: function(object, message) {
      this.object = object;
      this.message = message;
      console.error(this.object, this.message)
    },
    
    toArgs: function() {
      return toArgs([this.object, this.message])
    }
  });

  Exception.Misconfiguration = new Class({
    Extends: Exception,

    name: "Misconfiguration"
  });

})();

$equals = function(one, another) {
  if (one == another) return true;
  if ((!one) ^ (!another)) return false;
  if (typeof one == 'undefined') return false;
  
  if ((one instanceof Array) || one.callee) {
    var j = one.length;
    if (j != another.length) return false;
    for (var i = 0; i < j; i++) if (!$equals(one[i], another[i])) return false;
    return true;
  } else if (one instanceof Color) {
    return (one.red == another.red) && (one.green == another.green) && (one.blue == another.blue) && (one.alpha == another.alpha)
  } else if (typeof one == 'object') {
    if (one.equals) return one.equals(another)
    for (var i in one) if (!$equals(one[i], another[i])) return false;
    return true;
  }
  return false;
};


var LSD = {};
