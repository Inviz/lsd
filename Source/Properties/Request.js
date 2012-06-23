/*
---

script: Request.js

description: Make various requests to back end

license: Public domain (http://unlicense.org).

requires:
  - LSD.Journal

provides:
  - LSD.Request

...
*/

LSD.Request = LSD.Properties.Request = new LSD.Struct({
  state: function(state, old, meta) {
    switch (state) {
      case 'opened':
        this.change('progress', 0);
        break;
      case 'head':
        this.change('status', this.object.status);
        break;
      case 'complete':
        this.change('progress', 1);
        this.change('response', this.object.responseText)
    }
  },
  
  status: function() {
    
  },
  
  response: function() {
  },
  
  method: function(value) {
    if (typeof value == 'string') return value.toUpperCase();
  }
}, 'Journal');

LSD.Request.prototype._hash = function(key, value) {
  var fitst = key.charAt(0);
  if (first === first.toUpperCase()) return 'headers.' + key;
};
LSD.Request.prototype.encoding = 'utf-8';
LSD.Request.prototype.onStateChange = function() {
  this.set('state', this.request.readyState, this.request);
};
LSD.Request.prototype.isSuccess = function() {
  return this.status > 199 && this.status < 300;
};
LSD.Request.Formats = {
  html: 'text/html',
  htm:  'text/html',
  json: 'application/json',
  js:   'text/javascript'
};
LSD.Request.prototype._states = ['unsent', 'opened', 'head', 'loading', 'complete'];
LSD.Request.Data = new LSD.Struct('Data');
LSD.Request.Headers = new LSD.Struct({
  Accept: function(value) {
    return LSD.Requests.formats[value] || value;
  }
}, 'Journal');
LSD.Request.URL = new LSD.Struct({
})
LSD.Request.URL.prototype.onChange = function(key, value, meta, old) {
  
};
LSD.Request.URL.prototype.toString = function() {
  
}
LSD.Request.URL.prototype._regex = /^(?:(\w+):)?(?:\/\/(?:(?:([^:@\/]*):?([^:@\/]*))?@)?([^:\/?#]*)(?::(\d*))?)?(\.\.?$|(?:[^?#\/]*\/)*)([^?#]*)(?:\?([^#]*))?(?:#(.*))?/;
LSD.Request.URL.prototype._parts = ['scheme', 'user', 'password', 'host', 'port', 'directory', 'file', 'query', 'fragment'];