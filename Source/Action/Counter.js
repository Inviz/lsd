/*
---
 
script: Counter.js
 
description: Increments the number and the label in html element
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
  - String.Inflections/String.camelize
 
provides:
  - LSD.Action.Counter
  - LSD.Action.Increment
  - LSD.Action.Decrement
 
...
*/


!function() {

LSD.Action.Counter = LSD.Action.build({
  enable: function(target, number) {
    var counter = this.retrieve(target)
    if (!counter) this.store(target, (counter = new Counter(target.innerHTML)));
    target.innerHTML = counter.increment(number).toString();
  },
  
  disable: function(target, number) {
    var counter = this.retrieve(target)
    if (!counter) this.store(target, (counter = new Counter(target.innerHTML)));
    target.innerHTML = counter.decrement(number).toString();
  },

  enabler: 'increment',
  disabler: 'decrement'
});

var Counter = String.Counter = function(string) {
  this.parsed = this.parse(string);
  if (this.parsed) {
    this.parsed.shift();
    if (this.parsed[3].toLowerCase() == 'one') this.parsed[3] = 1;
    this.parsed[3] = parseInt(this.parsed[3]);
    var singular = (this.parsed[3] == 1);
    this[singular ? 'singular' : 'plural'] = this.parsed[9];
    this[singular ? 'plural' : 'singular'] = this.parsed[9][singular ? 'pluralize' : 'singularize']()
  }
};

Counter.prototype = {
  parse: function(string) {
    return (this.parsed = string.match(Counter.regexp));
  },
  
  increment: function(arg) {
    this.parsed[3] += (arg || 1)
    return this;
  },
  
  decrement: function(arg) {
    this.parsed[3] -= (arg || 1)
    return this;
  },
  
  toString: function() {
    var clone = this.parsed.slice(0);
    if (this.parsed[3]) {
      delete this.parsed[1];
      delete this.parsed[13];
    }
    this.parsed[9] = this[this.parsed[3] == 1 ? 'singular' : 'plural'];
    return this.parsed.join('');
  }
}

Counter.regexp = new RegExp('^(.*?\\s*)' + 
                            '((?:just|only)\\s*?)?' + 
                            '(<[^\\s\>]+?[^>]*?>\\s*)?' + 
                            '(\\d+|no|one)' + 
                            '(\\s*)' +
                            '(<\\/[^\\s]+?[^>]+?>)?' + 
                            '(\\s*)' +
                            '(<[^\\s]+?[^>]+?>)?' + 
                            '(\\s*)' +
                            '(.+?)' +
                            '(\\s*?)' + 
                            '(<\\/[^\\s]+?[^>]+?>)?' + 
                            '(\\s*?)' +
                            '(\\s*yet)?' +
                            '($|(?:\\s(?:now|on|if|under|at|in|for|by|so|and|to)\\s|[\\.\\!\\?\\;\\,]))(.*?)$', 'mi');
                            
}();