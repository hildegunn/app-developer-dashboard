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

		"initLoad": function() {

			var that = this;

			return that.feideconnect.vootGroupsList()
				.then(function(groups) {

					for(var i = 0; i < groups.length; i++) {

						var g = new Group(groups[i]);

						// Only use group memberships where a user is admin in an orgadmin group.
						if (!g.isType("fc:orgadmin")) { continue; }
						if (!g.isMemberType("admin")) { continue; }

						// console.error("GROUP ", g);
						that.enabled = true;
						that.roles[groups[i].org] = new GroupOption({"group": g});
					}

				})
				.then(this.proxy("draw"))
				.then(that.proxy("_initLoaded"));

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