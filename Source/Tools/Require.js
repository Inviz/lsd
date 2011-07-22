/*
---
 
script: Require.js
 
description: A require implementation that uses jsus-raptor middleware
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
  
provides:
  - require
 
...
*/

!function(document) {
  if (!this.requireURL) this.requireURL = '/javascripts/require/'
  
  var head = document.getElementsByTagName('head')[0];
  
  var retrieve = function(expression, hard) {
    // remove package name
    var bits = expression.split(':');
    bits = bits[bits.length - 1];
    // split by parts
    bits = bits.split('.');
    for (var i = 0, bit, obj = window; obj && (bit = bits[i++]);)
      if ((obj = obj[bit]) == null) 
        if (hard) throw "Can't find " + expression + ". Stopped at " + bit + ".";
    return obj;
  };

  var start = function(queue, callback) {
    var queued = {}, source;
    for (var i = 0, item; item = queue[i]; i++) {
      var object = retrieve(item);
      if (object) queue[i] = object;
      else queued[i] = item;
    }
    for (var index in queued) {
      var expression = queued[index];
      if (!source) source = expression;
      else source += '+' + expression;
    }
    if (!source) callback.apply(this, queue);
    else load(this.requireURL + source + ".js", function() {
      for (var index in queued) queue[index] = retrieve(queued[index]/*, true*/);
      callback.apply(window, queue)
    });
  }
  
  var load = function(source, callback) {
    var script = document.createElement('script');
    script.onload = callback,
    script.onreadystatechange = function () {
      var state = this.readyState;
      if ("loaded" === state || "complete" === state) {
        script.onreadystatechange = null;
        callback();
        head.removeChild(script);
      }
    };
    script.src = source;
    script.type = 'text/javascript';
    head.appendChild(script);
    return script;
  }
  
  this.use = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    if (args[args.length - 1].call) var callback = args.pop();
    return start(args, callback);
  }
}.call(window, document);
