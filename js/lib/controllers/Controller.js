define(function(require, exports, module) {

	var 
		$ = require('jquery'),
		Class = require('../class'),
		EventEmitter = require('../EventEmitter')
		;
	
	var Controller = Class.extend({
		"init": function(el) {
			this.el = el || this.el || $('<div class=""></div>');
			// this._super();
		},
		"ebind": function(type, filter, func) {
			this.el.on(type, filter, $.proxy(this[func], this));
		}
	});

	// Controller.extend(EventEmitter);

	return Controller;
});