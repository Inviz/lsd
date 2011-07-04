/*
---
 
script: Date.js
 
description: Work with dates like a boss
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Trait
  - More/Date

provides:
  - LSD.Trait.Date
 
...
*/

LSD.Trait.Date = new Class({
  options: {
    date: {
      interval: 'month',
      format: '%b-%d-%Y'
    }
  },
  
  setDate: function(date) {
    this.date = date;
    if (date) this.fireEvent('setDate', date)
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
  
  parseDate: function(date) {
    return Date.parse(date);
  },
  
  increment: function(number) {
    number = number.toInt ? number.toInt() : 1;
    this.setDate(this.getDate().increment(this.options.date.interval, number))
  },

  decrement: function(number) {
    number = number.toInt ? number.toInt() : 1;
    this.setDate(this.getDate().decrement(this.options.date.interval, number))
  }
  
});