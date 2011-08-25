/*
---
 
script: Date.js
 
description: Work with dates like a boss
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Mixin
  - More/Date

provides:
  - LSD.Mixin.Date
 
...
*/

LSD.Mixin.Date = new Class({
  options: {
    date: {
      interval: 'month',
      format: '%B %d, %Y'
    }
  },
  
  setDate: function(date) {
    if (date && !date.getDate) {
      var source = date;
      date = this.parseDate(date);
    }
    if (!date) return;
    if (source) this.dateSource = source;
    else if (this.dateSource) delete this.dateSource;
    this.date = date;
    this.fireEvent('setDate', [date, source])
  },
  
  formatDate: function(date) {
    return date.format(this.options.date.format)
  },
  
  getDate: function() {
    if (this.date) return this.date;
    if (this.getRawDate) {
      var raw = this.getRawDate();
      if (raw) return this.parseDate(raw);
    }
    return this.getDefaultDate();
  },
  
  getDefaultDate: function() {
    return new Date;
  },
  
  parseDate: function(input) {
    var date = Date.parse(input);
    if (date.isValid()) return date;
  },
  
  increment: function(number, interval) {
    number = number.toInt ? number.toInt() : 1;
    this.setDate(this.getDate().clone().increment(interval || this.options.date.interval, number))
  },

  decrement: function(number, interval) {
    number = number.toInt ? number.toInt() : 1;
    this.setDate(this.getDate().clone().decrement(interval || this.options.date.interval, number))
  }
  
});

LSD.Behavior.define(':date', 'date');