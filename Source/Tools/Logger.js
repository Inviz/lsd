/*
---
 
script: Logger.js
 
description: A logger, a queue and a console shim
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Array
  
provides:
  - LSD.Logger
  
...
*/

LSD.Array.Logger = function(options) {
  this.options = options;
  this.length = 0;
};
LSD.Array.Logger.start = + new Date
LSD.Array.Logger.prototype = Object.append({
  flush: function() {
    if (this.options) new Request.JSON(this.options).send(LSD.toObject(this));
  },
  
  build: function(method, args, meta) {
    if (!this.meta) this.meta = {
      screen: {
        height: screen.height,
        width: screen.width,
        color_depth: screen.colorDepth,
        pixel_depth: screen.pixelDepth
      },
      browser: {
        user_agent: navigator.userAgent
      },
      page: LSD.toObject({
        title: document.title,
        location: location.toString(),
        start: LSD.Array.Logger.start
      }),
      window: {
        width: window.getWidth(),
        height: window.getHeight()
      },
    }
    return Object.append({
      created_at: LSD.toObject(new Date),
      type: method,
      message: this.convert(Array.prototype.slice.call(args, 0)),
      browser: this.meta.browser,
      screen: this.meta.screen,
      page: this.meta.page,
      window: this.meta.window,
      scroll: {
        top: document.body.scrollTop,
        left: document.body.scrollLeft
      }
    }, meta);
  },
  
  convert: function(object) {
    if (object == null) return null;
    if (typeof object.message != 'undefined')
      return {
        filename: object.filename,
        line: object.lineno,
        message: object.message
      }
    switch (typeOf(object)) {
      case "array":
        return object.map(this.convert, this);
      case "object":
        return Object.map(object, this.convert, this);
      default:
        return LSD.toObject(object);
    }
  },
  
  time: function(name) {
    if (!this.times) this.times = {};
    this.times[name] = new Date;
  },
  
  timeEnd: function(name) {
    var time = this.times[name];
    if (time) {
      var now = new Date;
      return this.push(this.build('time', [name, now - time, now, time]));
    }
  },
  
  exception: function(exception) {
    var args = Array.prototype.slice.call(arguments, 1)
    var meta = {exception: this.convert(exception)};
    return this.push(this.build('exception', args, meta))
  }
}, LSD.Array.prototype);

['log', 'error', 'info'].each(function(method) {
  LSD.Array.Logger.prototype[method] = function() {
    return this.push(this.build(method, arguments))
  }
});

['profile', 'profileEnd', 'group', 'groupEnd', 'timeline'].each(function(method) {
  LSD.Array.Logger.prototype[method] = function() {
    if (window.console && console[method] && console[method].apply) 
      return console[method].apply(console, arguments);
  }
});

LSD.Logger = LSD.console = new LSD.Array.Logger;