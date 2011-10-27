/*
---
 
script: Logger.js
 
description: An observable object 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Script/LSD.Array
  
provides:
  - LSD.Logger
  
...
*/

LSD.Array.Logger = function(options) {
  this.options = options;
  this.length = 0;
};
LSD.Array.Logger.start = +(new Date)
LSD.Array.Logger.prototype = Object.append({
  flush: function() {
    if (this.options) new Request.JSON(this.options).send(LSD.toObject(this));
  },
  
  build: function(method, args) {
    var now = +(new Date)
    return {
      created_at: now,
      type: method,
      message: this.convert(Array.prototype.slice.call(args, 0)),
      browser: {
        user_agent: navigator.userAgent
      },
      screen: {
        height: screen.height,
        width: screen.width,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth
      },
      page: {
        title: document.title,
        location: location.toString(),
        lifetime: now - LSD.Array.Logger.start
      }
    };
  },
  
  convert: function(object) {
    if (object == null) return null;
    if (typeof object.message != 'undefined')
      return {
        filename: object.filename,
        line: object.lineno,
        message: object.message,
        timestamp: object.timestamp
      }
    switch (typeOf(object)) {
      case "array":
        return object.map(this.convert, this);
      case "object":
        return Object.map(object, this.convert, this);
    }
  }
}, LSD.Array.prototype);

['log', 'error', 'info', 'exception'].each(function(method) {
  LSD.Array.Logger.prototype[method] = function() {
    return this.push(this.build(method, arguments))
  }
});

LSD.Logger = new LSD.Array.Logger;