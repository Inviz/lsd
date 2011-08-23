/*
---
 
script: Uploader.js
 
description: Add your widget have a real form value.
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin
  - Widgets/LSD.Widget.Button
  - Widgets/LSD.Widget.Progress
  - Uploader/*
  - LSD.Mixin.List
  - Core/JSON
  
provides: 
  - LSD.Mixin.Uploader
 
...
*/

LSD.Mixin.Uploader = new Class({
  options: {
    actions: {
      uploader: {
        enable: function() {
          if (this.attributes.multiple) this.options.uploader.multiple = true;
          var uploader = this.getUploader();
          this.properties.set('uploader', uploader);
          var target = this.getUploaderTarget();
          if (target) uploader.attach(target);
          this.getStoredBlobs().each(this.addFile, this);
        },
        disable: function() {
          var uploader = this.getUploader();
          uploader.detach(this.getUploaderTarget())
          this.properties.unset('uploader', uploader);
        }
      }
    },
    events: {
      uploader: {
        fileComplete: 'onFileComplete',
        fileRemove: 'onFileRemove',
        fileProgress: 'onFileProgress',
        fileProgress: 'onFileProgress',
        beforeSelect: 'onBeforeFileSelect'
      }
    },
    has: {
      many: {
        targets: {
          selector: ':uploading',
          as: 'uploader',
          relay: {
            mouseover: function() {
              this.uploader.getUploader().attach(this.toElement());
            }
          }
        }
      }
    },
    states: Array.object('empty'),
    filelist: false,
    uploader: {
      instantStart: true,
      timeLimit: 36000,
      queued: false,
      multiple: false
    }
  },
  
  constructors: {
    uploader: function(options, state) {
      if (state) this.blobs = {};
      else delete this.blobs;
    }
  },
  
  getUploader: function() {
    if (this.uploader) return this.uploader;
    var options = Object.append({}, this.options.uploader);
    if (!options.fileClass) options.fileClass = this.getUploaderFileClass(Uploader.getAdapter());
    this.uploader = new Uploader(options);
    this.uploader.widget = this;
    return this.uploader;
  },
  
  onBeforeFileSelect: function() {
    this.lastUploaderTarget =  this.getUploader().target;
  },
  
  getUploaderTarget: function() {
    var target = this.options.uploader.target;
    if (target) {
      return target;
    } else if (target !== false) {
      return this.element
    }
  },

  getUploaderFileClass: function(adapter) {
    if (!adapter) adapter = Uploader.getAdapter();
    if (adapter.indexOf) adapter = Uploader[LSD.toClassName(adapter)];
    if (!adapter.File.Widget) {
      var Klass = new Class({
        Implements: [adapter.File, this.getUploaderFileClassBase()]
      });
      adapter.File.Widget = function() {
        return new LSD.Widget().mixin(Klass, true);
      }
    }
    return adapter.File.Widget;
  },
  
  getUploaderFileClassBase: function() {
    return LSD.Widget.Filelist.File
  },
  
  onFileComplete: function(file) {
    var blob = this.processStoredBlob(file.response.text);
    if (blob && !blob.errors) {
      this.onFileSuccess(file, blob);
    } else {
      this.onFileFailure(file, blob || response);
    }
  },
  
  processValue: function(file) {
    return file.id || file.uid;
  },
  
  onFileSuccess: function(file, blob) {
    this.addBlob(file, blob);
    file.fireEvent('success', blob);
  },
  
  onFileFailure: function(file, blob) {
    file.fireEvent('failure', blob);
  },
  
  onFileRemove: function(file) {
    this.removeBlob(file);
  },
  
  getBlob: function(file) {
    return this.blobs[file.id];
  },
  
  addBlob: function(file, blob) {
    this.setValue(blob);
    this.blobs[file.id] = blob;
  },
  
  removeBlob: function(file) {
    this.setValue(this.blobs[file.id], true);
    delete this.blobs[file.id];    
  },
  
  retrieveStoredBlobs: function() {
    var attrs = this.attributes;
    return attrs.file || attrs.files || attrs.blobs || attrs.blob;
  },

  processStoredBlob: function(response) {
    if (response.indexOf) response = JSON.decode(response);
    if (response && Object.getLength(response) == 1) response = response[Object.keys(response)[0]];
    return response;
  },
  
  getStoredBlobs: function() {
    var files = this.retrieveStoredBlobs();
    return files ? Array.from(JSON.decode(files)).map(this.processStoredBlob.bind(this)) : [];
  },
  
  addFile: function(blob) {
    var widget = new (this.getUploaderFileClass());
    widget.widget = this;
    widget.states.include('complete');
    widget.build();
    widget.setBase(this.getUploader());
    widget.setFile(blob);
    this.addBlob(widget, blob);
  }
});

LSD.Mixin.Upload = new Class({
  options: {
    has: {
      one: {
        progress: {
          source: 'progress',
          selector: 'progress'
        }
      }
    },
    events: {
      setBase: function() {
        if (this.target) this.targetWidget = this.target.retrieve('widget');
        this.build();
      },
      build: function() {
        this.inject(this.getWidget());
      },
      progress: function(progress) {
        if (this.progress) this.progress.set(progress.percentLoaded);
      },
      start: function() {
        this.states.include('started');
      },
      complete: function() {
        if (this.progress) this.progress.set(100);
        this.states.erase('started');
        this.states.include('complete');
      },
      stop: function() {
        this.states.erase('started');
      },
      remove: 'dispose'
    }
  },
  
  getParentWidget: function(widget) {
    return widget;
  },
  
  getWidget: function() {
    return (this.widget || this.base.widget);
  }
});

LSD.Widget.Filelist = new Class({
  options: {
    tag: 'filelist',
    inline: 'ul',
    pseudos: Array.from(':items'),
    has: {
      many: {
        items: {
          selector: 'file',
          source: 'filelist-file'
        }
      }
    }
  }
});

LSD.Widget.Filelist.File = new Class({
  options: {
    tag: 'file',
    inline: 'li',
    layout: {
      '::canceller': 'Cancel',
      '::progress': true
    },
    pseudos: Array.object('upload'),
    events: {
      setFile: function() {
        this.write(this.name);
      }
    },
    has: {
      one: {
        canceller: {
          selector: 'a.cancel',
          source: 'a.cancel',
          events: {
            click: 'cancel'
          }
        }
      }
    }
  }
});

LSD.Behavior.define(':uploader', 'uploader');
LSD.Behavior.define(':upload', 'upload');