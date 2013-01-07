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
LSD.URL.prototype.toString = function() {
  var url = '';
  if (this.scheme) url += this.scheme + '://';
  if (this.user) {
    url += this.user;
    if (this.password) url += ':' + this.password;
    url += '@';
  }
  if (this.host) url += this.host;
  if (this.port) url += ':' + this.port;
  if (this.directory) url += '/' + this.directory;
  if (this.file) url += this.file;
  if (this.query) url += '?' + this.query;
  if (this.fragment) url += '#' + this.fragment;
  return url;
};
LSD.URL.prototype.__cast = function(key, value, old, meta) {
  if (this._parts.indexOf(key) > -1 && meta !== 'composed') {
    var url = this.toString();
    this.set('url', url, this._composedURL, 'composed');
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
    if (typeof state == 'number') state = this._states[state];
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
    return state;
  },
  
  method: function(value) {
    if (typeof value == 'string') return value.toLowerCase();
  },
  
  status: function() {
    
  },
  
  response: function(response, old, meta, chunk) {
    if (response.charAt(0) == '{') {
      var type = this.object.getHeader && this.object.getResponseHeader('Content-Type')
      if (!type || type.indexOf('json') > -1) return eval(response)
    }
  },
  
  encoding: function() {
    
  },
  
  data: LSD.Struct('Data'),
  
  headers: LSD.Struct({
    Accept: function(value) {
      return this._owner._formats[value] || value;
    }
  }, 'Journal'),
  
  url: function(value, old, meta) {
    if (meta === 'composed') return;
    if (value != null) var parsed = this.parse(value);
    this.mix(undefined, parsed, this._composed, meta);
    this._composed = parsed;
  }
}, ['Data', 'Journal']);
LSD.Request.prototype.send = function () {
  return this[this.transport](true, arguments, false)
};
LSD.Request.prototype.prepare = function () {
  return this[this.transport](true, arguments, false)
};
LSD.Request.prototype.onStateChange = function() {
  this.set('state', this.request.readyState, undefined, this.request);
};
LSD.Request.prototype.isSuccess = function() {
  return this.status > 199 && this.status < 300;
};
LSD.Request.prototype.___hash = function(key) {
  debugger
  var first = key.charAt(0);
  if (first != '_' && first === first.toUpperCase())
    return 'headers.' + key;
  if (!this._properties[key] && this._parts.indexOf(key) == -1)
    return 'data.' + key;
};
LSD.Request.prototype._formats = {
  html: 'text/html',
  htm:  'text/html',
  json: 'application/json',
  js:   'text/javascript'
};  
LSD.Request.prototype._states = ['unsent', 'opened', 'head', 'loading', 'complete'];
LSD.Request.prototype.state = 'unsent';
LSD.Request.prototype.transport = 'xhr';
LSD.Request.prototype.encoding = 'utf-8';
LSD.Request.prototype.formats = ['text/html', 'application/json', 'text/xml'];
LSD.Request.prototype.negotiate = function(string, formats) {
  if (!formats) formats = this.formats;
  for (var i = 0, best; index = string.indexOf(',', i);) {
    var option = string.substring(i, index == -1 ? string.length : index);
    var q = 1, value = null, variant = null;
    for (var j = 0, pos, eql; (pos = option.indexOf(';', j)) > -1 || j;) {
      var str = option.substring(j, pos == -1 ? option.length : pos);
      if (j) {
        if ((eql = str.indexOf('=')) > -1) {
          var name = str.substring(0, eql);
          var value = str.substring(eql + 1);
          switch (name) {
            case 'q':
              q = parseFloat(value);
              break;
            case 'charset':
          }
        }
      } else variant = str;
      if (pos == -1) break;
      for (j = pos + 1; option.charAt(j) == ' ';) j++;
    }
    if (!(q < best)) {
      var str = variant || option;
      var slash = str.indexOf('/');
      if (slash == -1) {
        if (formats.indexOf(str) > -1) {
          best = q;
          chosen = format;
        }
      } else {
        var group = str.substring(0, slash);
        var type = str.substring(slash + 1);
        for (var k = 0, format; format = formats[k++];) {
          slash = format.indexOf('/');
          var g = format.substring(0, slash);
          var t = format.substring(slash + 1);
          if ((group == '*' || group == format.substring(0, slash))) 
          if ((type == '*' || type == format.substring(slash + 1))) {
            best = q
            chosen = format;
            break;
          }
        }
      }
    }
    if (index == -1) break;
    for (i = index + 1; string.charAt(i) == ' ';) i++;
  }  
  return chosen;
}
LSD.Request.prototype.xhr = function(immediate, object) {
  if (!object) {
    object = new XMLHTTPRequest;
    var self = this
    object.onreadystatechange = function() {
      self.set('state', object.readyState);
    }
  } else if (object.readyState)
    object.abort();
  if (immediate) {
    if (this.headers) for (var name in this.headers)
      if (this.headers.has(name)) try {
        object.setHeader(name, this.headers[name])
      } catch (e) {};
    var url = this.url;
    var data = this.data.toString();
    if (this.method == 'get') {
      if (data.length)
        url += (url.indexOf('?') > -1 ? '&' : '?') + data;
      object.open('GET', url)
      object.send();
    } else {  
      object.open('POST', url);
      if (this.method != 'post')
        data += (data.length ? '&' : '') + '_method=' + this.method;
      object.send(data);
    }
  }
  return object;
}
LSD.Request.prototype.form = function(immediate, object, doc) {
  if (!doc) doc = object && object.document || document;
  if (!object)
    object = doc.createElement('form');
  if (object.parentNode != doc.body)
    doc.body.appendChild(object.parentNode);
  return object;
};
LSD.Request.prototype.iframe = function(immediate, object) {
  if (!object) {
    object = document.createElement('iframe');
    var self = this;
    object.onload = function() {
      self.set('state', 'complete')
    }
    this.form(null, null, object.contentWindow.document);
  }
  return object;
}