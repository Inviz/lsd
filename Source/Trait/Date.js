/*
---
 
script: Date.js
 
description: Work with dates like a boss
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - More/Date

provides:
  - LSD.Trait.Date
 
...
*/

LSD.Trait.Date = new Class({
  options: {
    date: {
      interval: 'month'
    }
  },
  
  setDate: function(date) {
    this.date = date;
  },
  
  getDate: function() {
    if (this.date) return this.date;
    if (this.getRawDate) return this.date = this.parseDate(this.getRawDate());
  },
  
  parseDate: function(date) {
    return Date.parse(date);
  },
  
  increment: function(number) {
    this.setDate(this.date.increment(this.options.calendar.interval, number || 1))
  },

  decrement: function(number) {
    this.setDate(this.date.decrement(this.options.calendar.interval, number || 1))
  }
  
})