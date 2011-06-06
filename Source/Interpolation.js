/*
---
 
script: Interpolation.js
 
description: A logic to render (and nest) widgets out of the key-value hash or dom tree
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Sheet/SheetParser.Value
  - String.Inflections/String.pluralize

provides: 
  - LSD.Interpolation
 
...
*/


!function() {
  LSD.Interpolation = {}
  var helpers = LSD.Interpolation.helpers = {
    pluralize: function(count, singular, plural) {
      var value = (count == 1) ? singular : (plural || (singular.pluralize()));
      return value.replace("%", count);
    },
    auto_pluralize: function(count, singular, plural) {
      return count + " " + helpers.pluralize(count, singular, plural);
    }
  }
  
  var regex = SheetParser.Value.tokenize;
  var parsed = {};
  
  var interpolate = LSD.Interpolation.execute = function(name, callback, simple) {
    if (!simple || (name.indexOf('(') > -1)) return run(translate(name), callback);
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
  };
  
  var run = LSD.Interpolation.run = function(command, callback) {
    var fn = command.fn;
    if (fn) {
      var func = fn.indexOf ? (helpers[fn] || (callback(fn))) : fn;
      if (!func) {
        console.error(fn, ' interpoaltion function is not found');
        return "";
      }
      var args = Array.prototype.slice.call(command.arguments, 0);
      for (var i = 0, j = args.length; i < j; i++) args[i] = run(args[i], callback);
      if (command.callback) args.splice(1, 0, callback);
      return func.apply(this, args);
    }
    return command;
  };
  
  var attempt = LSD.Interpolation.attempt = function(string) {
    var count = 0, args = arguments;
    string = string.replace(/\\?\{([^{}]+)\}/g, function(match, name){
      count++;
      if (match.charAt(0) == '\\') return match.slice(1);
      for (var arg, value, callback, element, i = 1, j = args.length; i < j; i++) {
        if (!(arg = args[i])) continue;
        if (arg.call) callback = call;
        else if (arg.localName) element = arg;
        else if (arg[match]) return arg[match];
      }
      return interpolate(match, callback) || (element && element.getAttribute('data-' + match.dasherize)) || "";
    });
    return count ? string : false;
  };
  
  var from = LSD.Interpolation.from = function() {
    var args = Array.prototype.slice(arguments, 0);
    return function(string) {
      return attempt.apply([string].concat(args));
    };
  };
  
}();