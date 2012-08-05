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

LSD.URL = new LSD.Struct({})
LSD.URL.prototype.onChange = function(key, value, meta, old) {
  if (this._parts.indexOf(key) > -1)
    this.change('value', this.toString());
};
LSD.URL.prototype.toString = function() {
  var url = '';
  if (this.scheme) url += this.scheme + '://';
  if (this.user) {
    url += this.user;
    if (this.password) url += ':' + this.password;
    url += '@';
  }
  if (this.host) url += this.host;
  if (this.post) url += ':' + this.post;
  if (this.directory) url += '/' + this.directory;
  if (this.file) url += this.file;
  if (this.query) url += '?' + this.query;
  if (this.fragment) url += '#' + this.fragment;
  return url;
}
LSD.URL.prototype.onChange = function(key, value, meta) {
  if (this._parts.indexOf(key) > -1 && meta !== 'composed') {
    var url = this.toString();
    this.set('url', url, 'composed', this._composedURL);
    this._composedURL = url;
  }
}
LSD.URL.prototype.parse = function(url) {
  var match = url.match(this._regex)
  if (match) for (var i = 1, j = match.length; i < j; i++) {
    if (!parsed) var parsed = {};
    if (match[i]) parsed[this._parts[i - 1]] = match[i];
  }
  return parsed;
};
LSD.URL.prototype._regex = /^(?:(\w+):)?(?:\/\/(?:(?:([^:@\/]*):?([^:@\/]*))?@)?([^:\/?#]*)(?::(\d*))?)?(\.\.?$|(?:[^?#\/]*\/)*)([^?#]*)(?:\?([^#]*))?(?:#(.*))?/;
LSD.URL.prototype._parts = ['scheme', 'user', 'password', 'host', 'port', 'directory', 'file', 'query', 'fragment'];


LSD.Request = LSD.Properties.Request = new LSD.Struct({
  Extends: LSD.URL,
  
  state: function(state, old, meta) {
    switch (state) {
      case 'unsent':
        break;
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
  
  transport: function() {
    
  },
  
  method: function(value) {
    if (typeof value == 'string') return value.toLowerCase();
  },
  
  status: function() {
    
  },
  
  response: function() {
    
  },
  
  encoding: function() {
    
  },
  
  data: LSD.Struct('Data'),
  
  headers: LSD.Struct({
    Accept: function(value) {
      return LSD.Requests.formats[value] || value;
    }
  }, 'Journal'),
  
  url: function(value, old, meta) {
    if (meta !== 'composed') {
      if (value != null) var parsed = this.parse(value);
      this.mix(parsed, undefined, meta, this._composed);
      this._composed = parsed;
    }
  }
}, 'Journal');
LSD.Request.prototype.send = function () {
  if (!this.object)
    this.set('object', new XMLHTTPRequest)
  else if (this.object.readyState)
    this.object.abort();
  for (var name in this.headers)
    if (this.headers.has(name))
      this.setHeader(name, this.headers[name])
  this.send();
}
LSD.Request.prototype.state = 'unsent';
LSD.Request.prototype.encoding = 'utf-8';
LSD.Request.prototype._hash = function(key, value) {
  var first = key.charAt(0);
  if (first != '_' && first === first.toUpperCase())
    return 'headers.' + key;
  if (!this._properties[key] && this._parts.indexOf(key) == -1)
    return 'data.' + key;
};
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