define(function(require, exports, module) {
	"use strict";

	var 
		$ = require('jquery'),
		Controller = require('./Controller'),
		EventEmitter = require('../EventEmitter'),
		TemplateEngine = require('../TemplateEngine')

		
		;


	var template = require('text!templates/Breadcrumb.html');

	var BCController = Controller.extend({

		"init": function(el) {
			this._super(el);
			this.tmp = new TemplateEngine(template);
		},

		"draw": function(items) {


			// var txt = '<div class="row"><div class="col-md-12"><ol class="breadcrumb">';
			// var i;

			// for(i = 0; i < items.length; i++) {
			// 	txt += '<li><a href="#">' + items[i].title + '</a></li>';
			// }
			// txt += '</ol></div></div>';
			// this.el.empty().append(txt);
			var view = {
				"items": items
			};
			this.tmp.render(this.el.empty(), view);
			this.show();
		},


		"hide": function() {
			this.el.hide();
		},

		"show": function() {
			this.el.show();
		}


	}).extend(EventEmitter);


	return BCController;
});