define(function(require, exports, module) {

	var 
		$ = require('jquery'),
		Class = require('../class'),
		EventEmitter = require('../EventEmitter')
		;
	
	var Controller = Class.extend({

		"init": function(el, load) {
			this.el = el || this.el || $('<div class=""></div>');

			this._loaderTimeout = 8000;

			this.debug = false;
			
			this.onLoadedCallbacks = [];
			this.isLoaded = false;
			if (load === true) {
				this.initLoad();
			}
		},
		"registerOnLoaded": function(func) {
			this.onLoadedCallbacks.push(func);
		},
		"onLoaded": function(title) {

			var num = Math.floor(Math.random()*900 + 100);

			if (this.debug) {
				console.trace(num);
			}
			var that = this;
			if (this.isLoaded) {
				return new Promise(function(resolve, reject) {
					// console.error("Already loaded, returning a empty PROMISE");
					resolve(that);
				});
			}

			return new Promise(function(resolve, reject) {
				that.registerOnLoaded(resolve);
				setTimeout(function() {
					if (!that.isLoaded) {
						reject(new Error("Loading this objected timed out. (Time out is set to " + that._loaderTimeout + "ms) " + num));
					}
				}, that._loaderTimeout);
			});

		},
		"_initLoaded": function() {
			var i;
			if (!this.isLoaded) {
				this.isLoaded = true;
				for(i = 0; i < this.onLoadedCallbacks.length; i++) {
					this.onLoadedCallbacks[i](this);
				}
				this.onLoadedCallbacks = [];
			}
		},
		"initLoad": function() {
			var that = this;
			return new Promise(function(resolve, reject) {
				that._initLoaded();
				resolve();
			});
		},
		"show": function() {
			this.el.show();
		},
		"hide": function() {
			this.el.hide();
		},
		"ebind": function(type, filter, func) {
			this.el.on(type, filter, $.proxy(this[func], this));
		},
		"proxy": function(func) {
			var that = this;
			var args = Array.prototype.splice.call(arguments, 1);
			return function() {
				return that[func].apply(that, args);
			};
		}
	});

	return Controller;
});