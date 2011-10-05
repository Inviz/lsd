/*
---
 
script: Script/Helpers.js
 
description: Defines sets of functions used in LSD.Script
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Script
  
provides:
  - LSD.Script.Functions
  - LSD.Script.Helpers
  
...
*/

/*
  Helpers are accessible both as LSD.Script.Helpers and LSD.Script.Functions
*/
LSD.Script.Helpers = LSD.Script.Functions = LSD.Script.Helpers || LSD.Script.Functions || {};

Object.append(LSD.Script.Helpers, {
  /*
    Returns the number of elements in collection
    
      count($ ul > li)
  */

  count: function(elements) {
    return elements.push ? elements.length : +!!elements
  },
  
  /*
    Pluralize is a three functions in one:
    
      pluralize("beach") // => "beaches"
      
    When given a single string argument, it returns pluralized form of that word
    
      pluralize(2, "beach", "beachiz") // => "2 beachiz"
      
    When a first argument is a number and second is a word, it returns singular form
    of that word if a number is 1, and plural if its more than 2. Optional second argument
    sets custom plural form for the word
    
      pluralize(2, "comment", "beachiz (%)") => "beachiz (2)"
      
    If a string form contains placeholder in form a percent sign, it uses that spot for
    the number, instead of prepending it.
  */
  
  pluralize: function(count, singular, plural) {
    var value = (count == 1) ? singular : (plural || (singular.pluralize()));
    var index = value.indexOf('%');
    if (index > -1) {
      return value.substr(0, index) + count + value.substr(index + 1, value.length - index - 1);
    } else {
      return count + ' ' + value;
    }
  },
  
  pluralize_word: function(count, singular, plural) {
    return (count == 1) ? singular : (plural || (singular.pluralize()));
  }
});

// Import all string prototype methods as helpers (first argument translates to string)
for (var name in String.prototype)
  if (!LSD.Script.Helpers[name] && String.prototype[name].call && name.charAt(0) != '$') 
    LSD.Script.Helpers[name] = (function(name) {
      return function() {
        return String.prototype[name].apply(String(arguments[0]), Array.prototype.slice.call(arguments, 1));
      }
    })(name);
    
// Import all number prototype methods as helpers (first argument translates to number)
for (var name in Number.prototype) 
  if (!LSD.Script.Helpers[name] && Number.prototype[name].call && name.charAt(0) != '$')
    LSD.Script.Helpers[name] = (function(name) {
      return function(a) {
        return Number.prototype[name].apply(Number(arguments[0]), Array.prototype.slice.call(arguments, 1));
      }
    })(name);
    
LSD.Script.Operators = {
  '*': 1, '/': 1,
  '+': 2, '-': 2,
  '>': 3, '<': 3,
  '^': 4, '&': 4, '|': 4, 
  '==': 4, '===': 4, 
  '!=': 4, '!==': 4,
  '>=': 4, '<=': 4, 
  '&&': 5, '||': 5
};  

for (var operator in LSD.Script.Operators)
  LSD.Script.Helpers[operator] = new Function('left', 'right', 'return left ' + operator + ' right');