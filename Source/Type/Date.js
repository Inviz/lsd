/*
---
 
script: Date.js
 
description: Flexible date object heavily. Ripoff of an amazing mootools-more Date library
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Object

provides: 
  - LSD.Date
 
...
*/

LSD.Date = function(date) {
  switch (typeof date) {
    case 'string':
      date = LSD.Date.parse(date);
      break;
    case 'number':
      date = new Date(date);
      break;
    case 'object': case 'undefined':
      if (date == null) date = new Date;
  }
  this.set('object', date)
}
LSD.Date.prototype = new LSD.Object;
LSD.Date.prototype._properties = {
  object: function(value, old) {
    var lengths = this.lengths;
    for (var name in lengths) {
      var method = 'get' + lengths[name];
      this.set(name, value && value[method](), old && old[method](), 'object')
    }
  },
  time: function(value) {
    if (value) {
      value = Date.parse(value);
    }
  },
  year: function() {

  },
  month: function() {
    
  },
  date: function() {
    
  },
  hours: function() {
    
  },
  minutes: function() {

  },
  seconds: function() {
    
  },
  milliseconds: function() {

  },
  locale: function() {

  },
  format: function() {

  }
};
LSD.Date.prototype._hash = function(key) {
  var alias = this.aliases[key];
  if (alias) return alias;
}
LSD.Date.prototype._onChange = function(key, value, old, meta) {
  if (meta != 'object') {
    var property = this._properties[key];
    if (property) {
      var lengths = this.lengths;
      var method = lengths[key];
      if (method) {
        this.object['set' + method](value);
        var after = this.object['get' + method]();
        if (after != value) {
          var prop
          for (var name in lengths) {
            if (name == key)
              break;
            prop = name;
          }
          if (prop)
            this.set(prop, this.object['get' + lengths[prop]]());
          value = after;
        }
      }
      property.call(this, value, old, meta);
    }
  }
  return value;
}
LSD.Date.prototype.toString = 
LSD.Date.prototype._format = 
LSD.Date.prototype.strftime = function(format){
  //if (!this.isValid()) return 'invalid date';

  if (!format)
    format = '%x %X';
  if (typeof format == 'string')
    format = this.formats[format] || format;
  if (typeof format == 'function')
    return format(this);
  
  var date = this;
  return format.replace(/%([a-z%])/gi,
    function($0, $1){
      switch ($1){
        case 'a': return Date.getMsg('days_abbr')[date['day']];
        case 'A': return Date.getMsg('days')[date['day']];
        case 'b': return Date.getMsg('months_abbr')[date['month']];
        case 'B': return Date.getMsg('months')[date['month']];
        case 'c': return date.strftime('%a %b %d %H:%M:%S %Y');
        case 'd': return date.pad(date.date, 2);
        case 'e': return date.pad(date.date, 2, ' ');
        case 'H': return date.pad(date.hours, 2);
        case 'I': return date.pad((date.hours % 12) || 12, 2);
        case 'j': return date.pad(date['dayofyear'], 3);
        case 'k': return date.pad(date.hours, 2, ' ');
        case 'l': return date.pad((date.hours % 12) || 12, 2, ' ');
        case 'L': return date.pad(date.milliseconds, 3);
        case 'm': return date.pad((date.month + 1), 2);
        case 'M': return date.pad(date.minutes, 2);
        case 'o': return date['ordinal'];
        case 'p': return Date.getMsg(date['ampm']);
        case 's': return Math.round(d / 1000);
        case 'S': return date.pad(date.seconds, 2);
        case 'T': return date.format('%H:%M:%S');
        case 'U': return date.pad(date['week'], 2);
        case 'w': return date.day;
        case 'x': return date.strftime(Date.getMsg('shortDate'));
        case 'X': return date.strftime(Date.getMsg('shortTime'));
        case 'y': return date.year.toString().substr(2);
        case 'Y': return date.year;
        case 'z': return date['GMTOffset'];
        case 'Z': return date['Timezone'];
      }
      return $1;
    }
  );
};
LSD.Date.prototype.regexOf = function(type){
  return new RegExp('(?:' + Date.getMsg(type).map(function(name){
    return name.substr(0, 3);
  }).join('|') + ')[a-z]*');
};

LSD.Date.prototype.getOrderIndex = function() {
  return 1;
}

LSD.Date.prototype.replacers = function(key){
  switch (key){
    case 'T':
      return '%H:%M:%S';
    case 'x': // iso8601 covers yyyy-mm-dd, so just check if month is first
      return ((LSD.Date.prototype.getOrderIndex('month') == 1) ? '%m[-./]%d' : '%d[-./]%m') + '([-./]%y)?';
    case 'X':
      return '%H([.:]%M)?([.:]%S([.:]%s)?)? ?%p? ?%z?';
  }
  return null;
};

LSD.Date.prototype.lengths = {
  year: 'FullYear',
  month: 'Month',
  date: 'Date',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
  milliseconds: 'Milliseconds',
  offset: 'TimezoneOffset'
};
!function(proto) {
  for (var name in proto.lengths)
    if (LSD.prototype[name] == null)
      LSD.prototype[name] = 0;
}(LSD.Date.prototype)
LSD.Date.prototype.aliases = {
  ms: 'milliseconds',
  millisecond: 'milliseconds',
  s: 'seconds',
  second: 'seconds',
  h: 'hours',
  hr: 'hours',
  hour: 'hours',
  d: 'date',
  day: 'date',
  m: 'minutes',
  min: 'minutes',
  minute: 'minutes',
  mo: 'month',
  mos: 'month',
  months: 'month',
  w: 'week',
  weeks: 'week',
  y: 'year',
  years: 'year',
  yr: 'year',
  yrs: 'year'
}
LSD.Date.prototype.patterns = [
  '%Y([-./]%m([-./]%d((T| )%X)?)?)?', // "1999-12-31", "1999-12-31 11:59pm", "1999-12-31 23:59:59", ISO8601
  '%Y%m%d(T%H(%M%S?)?)?', // "19991231", "19991231T1159", compact
  '%x( %X)?', // "12/31", "12.31.99", "12-31-1999", "12/31/2008 11:59 PM"
  '%d%o( %b( %Y)?)?( %X)?', // "31st", "31st December", "31 Dec 1999", "31 Dec 1999 11:59pm"
  '%b( %d%o)?( %Y)?( %X)?', // Same as above with month and day switched
  '%Y %b( %d%o( %X)?)?', // Same as above with year coming first
  '%o %b %d %X %z %Y', // "Thu Oct 22 08:11:23 +0000 2009"
  '%T', // %H:%M:%S
  '%H:%M( ?%p)?' // "11:05pm", "11:05 am" and "11:05"
]
LSD.Date.prototype.formats = {
  db: '%Y-%m-%d %H:%M:%S',
  compact: '%Y%m%dT%H%M%S',
  'short': '%d %b %H:%M',
  'long': '%B %d, %Y %H:%M',
  rfc822: function(date){
    return rfcDayAbbr[date['day']] + date.format(', %d ') + rfcMonthAbbr[date['month']] + date.format(' %Y %H:%M:%S %Z');
  },
  rfc2822: function(date){
    return rfcDayAbbr[date['day']] + date.format(', %d ') + rfcMonthAbbr[date['month']] + date.format(' %Y %H:%M:%S %z');
  },
  iso8601: function(date){
    return (
      date.getUTCFullYear() + '-' +
      this.pad(date.getUTCMonth() + 1, 2) + '-' +
      this.pad(date.getUTCDate(), 2) + 'T' +
      this.pad(date.getUTCHours(), 2) + ':' +
      this.pad(date.getUTCMinutes(), 2) + ':' +
      this.pad(date.getUTCSeconds(), 2) + '.' +
      this.pad(date.getUTCMilliseconds(), 3) + 'Z'
    );
  }
};

LSD.Date.prototype.keys = {
  d: /[0-2]?[0-9]|3[01]/,
  H: /[01]?[0-9]|2[0-3]/,
  I: /0?[1-9]|1[0-2]/,
  M: /[0-5]?\d/,
  s: /\d+/,
  o: /[a-z]*/,
  p: /[ap]\.?m\.?/,
  y: /\d{2}|\d{4}/,
  Y: /\d{4}/,
  z: /Z|[+-]\d{2}(?::?\d{2})?/
};

LSD.Date.prototype.keys.m = LSD.Date.prototype.keys.I;
LSD.Date.prototype.keys.S = LSD.Date.prototype.keys.M;

//LSD.Date.prototype.keys.a = 
//LSD.Date.prototype.keys.A = LSD.Date.prototype.regexOf('days');
//LSD.Date.prototype.keys.b = 
//LSD.Date.prototype.keys.B = LSD.Date.prototype.regexOf('months');

LSD.Date.prototype.build = function(format){
  var parsed = [];
  var self = this;
  var re = (format.source || format) // allow format to be regex
   .replace(/%([a-z])/gi,
    function($0, $1){
      return self.replacers($1) || $0;
    }
  ).replace(/\((?!\?)/g, '(?:') // make all groups non-capturing
   .replace(/ (?!\?|\*)/g, ',? ') // be forgiving with spaces and commas
   .replace(/%([a-z%])/gi,
    function($0, $1){
      var p = self.keys[$1];
      if (!p) return $1;
      parsed.push($1);
      return '(' + p.source + ')';
    }
  ).replace(/\[a-z\]/gi, '[a-z\\u00c0-\\uffff;\&]'); // handle unicode words

  return {
    format: format,
    re: new RegExp('^' + re + '$', 'i'),
    handler: function(bits){
      bits = bits.slice(1);
      var associated = {};
      for (var i = 0, j = bits.length; i < j; i++)
        associated[parsed[i]] = bits[i];
      bits = associated;
      var date = new LSD.Date();
      date.object.setSeconds(0);
      date.object.setHours(0);
      date.object.setMinutes(0);
      date.object.setMilliseconds(0);
      var year = bits.y || bits.Y;

      if (year != null) date.handle('y', year); // need to start in the right year
      if ('d' in bits) date.handle('d', 1);
      if ('m' in bits || bits.b || bits.B) date.handle('m', 1);

      for (var key in bits) date.handle(key, bits[key]);
      return date;
    }
  };
};

LSD.Date.prototype.handle = function(key, value){
  if (!value) return this;

  switch (key){
    case 'a': case 'A': return this.set('day', Date.parseDay(value, true));
    case 'b': case 'B': return this.set('month', Date.parseMonth(value, true));
    case 'd': return this.set('date', value);
    case 'H': case 'I': return this.set('hours', value);
    case 'm': return this.set('month', value - 1);
    case 'M': return this.set('minutes', value);
    case 'p': return this.set('ampm', value.replace(/\./g, ''));
    case 'S': return this.set('seconds', value);
    case 's': return this.set('milliseconds', ('0.' + value) * 1000);
    case 'w': return this.set('day', value);
    case 'Y': return this.set('year', value);
    case 'y':
      value = +value;
      if (value < 100) value += startCentury + (value < startYear ? 100 : 0);
      return this.set('year', value);
    case 'z':
      if (value == 'Z') value = '+00';
      var offset = value.match(/([+-])(\d{2}):?(\d{2})?/);
      offset = (offset[1] + '1') * (offset[2] * 60 + (+offset[3] || 0)) + this.getTimezoneOffset();
      return this.set('time', this - offset * 60000);
  }

  return this;
};
LSD.Date.prototype.pad = function(n, digits, string){
  if (digits == 1) return n;
  return n < Math.pow(10, digits - 1) ? (string || '0') + this.pad(n, digits - 1, string) : n;
};

LSD.Date.prototype.isValid = function(date){
  if (!date) date = this.object;
  return date && date instanceof Date && !isNaN(date.valueOf());
};


LSD.Date.parse = function(from) {
  var t = typeof from;
  if (t == 'number') return new Date(from);
  if (t != 'string') return from;
  //from = from.clean();
  if (!from.length) return null;

  var parsers = LSD.Date.prototype.parsers;
  for (var i = 0, parser; parser = parsers[i++];) {
    var bits = parser.re.exec(from);
    if (bits) {
      var parsed = parser.handler(bits);
      break;
    }
  }

  if (!(parsed && parsed.isValid())){
    parsed = new Date(Date.parse(from));
    if (!(parsed && parsed.isValid())) 
      parsed = new Date(parseInt(from));
  }
  return parsed;
}



LSD.Date.prototype.parsers = [];
LSD.Date.prototype.patterns.forEach(function(pattern, i){
  LSD.Date.prototype.parsers.push(LSD.Date.prototype.build(pattern));
});