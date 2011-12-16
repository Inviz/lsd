LSD.Properties = {
  context: function(value, state, old) {
    var source = this.source;
    if (source) this.unset('source', source);
    if (state) {
      if (typeof value == 'string') {
        var camel = LSD.toClassName(value);
        this.factory = LSD.global[this.options.namespace][camel];
        if (!this.factory) throw "Can not find LSD.Type in " + ['window', this.options.namespace, camel].join('.');
      } else {
        this.factory = value;
      }
    }
    if (source) this.set('source', source);
  },

  tag: function(value, state, old) {
    if (!this.options.source && this.prepared) {
      if (state && value) this.set('source', value)
      else if (old) this.unset('source', value);
    }
  },
  
  source: function(value, state, old) {
    if (state && value) {
      var role = LSD.Module.Properties.getRole(this);
      if (role && this.role === role) return;
    }
    if (this.prepared) {
      if (state) {
        this.set('role', role);
      } else if (this.role) {
        this.unset('role', this.role);
      }
    }
  },
  
  role: function(value, state, old) {
    if (state) {
      if (role == null) role = this.getRole(this)
      if (role) {
        this.mixin(role);
        if ((this.sourced = this.captureEvent('setRole', role)))
          this.setOptions(this.sourced);
      }
      return role;
    } else {
      this.unmix(role);
      var options = this.sourced;
      if (options) {
        delete this.sourced;
        this.unsetOptions(options);
      }
    }
  },
  
  scope: function(value, state, old) {
    if (state) return LSD.Script.Scope.setScope(this, value)
    else if (old) LSD.Script.Scope.unsetScope(this, value);
  }
};

