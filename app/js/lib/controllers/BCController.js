define(function(require, exports, module) {
	"use strict";

	var 
		$ = require('jquery'),
		Controller = require('./Controller'),
		EventEmitter = require('../EventEmitter'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine')
		;


	var template = require('text!templates/breadcrumb.html');

	var BCController = Controller.extend({

		"init": function(el) {
			this._super(el);
			this.tmp = new TemplateEngine(template);
		},

		"draw": function(items) {

			var view = {
				"items": items
			};
			this.tmp.render(this.el.empty(), view);
			this.show();
		}


	}).extend(EventEmitter);


	return BCController;
});
