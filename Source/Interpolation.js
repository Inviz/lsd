/*
---
 
script: Interpolate.js
 
description: A logic to render (and nest) widgets out of the key-value hash or dom tree
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Sheet/SheetParser.Value
  - StringInflections/String.pluralize

provides: 
  - LSD.Interpolate
 
...
*/


!function() {
  LSD.Interpolation = {}
  var helpers = LSD.Interpolation.helpers = {
    pluralize: function(count, singular, plural) {
      if (count == 1) return singular;
      return plural || (singular.pluralize())
    },
    auto_pluralize: function(count, singular, plural) {
      return count + " " + helpers.pluralize(count, singular, plural);
    }
  }
  
  var regex = SheetParser.Value.tokenize;
  var parsed = {};
  
  var interpolate = LSD.Interpolation.interpolate = function(name, callback, simple) {
    if (!simple || (name.indexOf('(') > -1)) return execute(translate(name), callback);
    return callback(name);
  }
  
  var translate = LSD.Interpolation.translate = function(value) {
    var cached = parsed[name];
    if (cached) return cached;
    var found, result = [], matched = [], scope = result, func, text;
    var names = regex.names;
    while (found = regex.exec(value)) matched.push(found);
    for (var i = 0; found = matched[i++];) {
      if (func = found[names['function']]) {
        var translated = translate(found[names._arguments]);
        for (var j = 0, bit; bit = translated[j]; j++) if (bit && bit.length == 1) translated[j] = bit[0];
        scope.push({fn: func, arguments: translated});
      } else if (text = (found[names.dstring] || found[names.sstring])) {
        scope.push(text)
      } else if (text = found[names.token]) {
        scope.push({fn: interpolate, arguments: [text, true], callback: true})
      }
    }
    return (parsed[value] = (result.length == 1 ? result[0] : result));
  }
  
  var execute = LSD.Interpolation.execute = function(command, callback) {
    var fn = command.fn;
    if (fn) {
      var func = fn.indexOf ? (helpers[fn] || (callback(fn))) : fn;
      if (!func) {
        console.error(fn, ' interpoaltion function is not found');
        return "";
      }
        console.log(fn.indexOf ? fn : '', command.arguments)
      var args = Array.prototype.slice.call(command.arguments, 0);
      for (var i = 0, j = args.length; i < j; i++) args[i] = execute(args[i], callback);
      if (command.callback) args.splice(1, 0, callback);
      return func.apply(this, args);
    }
    return command;
  }
  
}();