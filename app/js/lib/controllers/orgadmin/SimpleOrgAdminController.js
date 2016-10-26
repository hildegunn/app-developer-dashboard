define(function(require, exports, module) {
	"use strict";

	var 
		Controller = require('../Controller'),
		EventEmitter = require('../../EventEmitter'),
		Dictionary = require('../../Dictionary'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine')

		;

	var template = require('text!templates/SimpleOrgAdmin.html');



	var SimpleOrgAdminController = Controller.extend({
		"init": function(feideconnect, orgAdminClients, usercontext) {

			var that = this;
			this.feideconnect = feideconnect;
			this.orgAdminClients = orgAdminClients;
			this.usercontext = usercontext;

			this.showCount = 3;

			this._super();

			this.dict = new Dictionary();
			this.tmp = new TemplateEngine(template, this.dict, true);
			this.orgAdminClients.on('clientsChange', function() { that.draw(); });

			this.ebind("click", ".actManageMandatory", "actManageMandatory");

		},

		"processView": function(clients) {

			var data = {
				"clients": [],
				"hasClients": false,
				"count": 0,
				"hasMore": false,
				"rest": 0
			};

			if (clients.length === 0) {
				return data;
			}

			data.count = clients.length;
			data.hasClients = true;

			for(var i = 0; i < clients.length; i++) {
				if (i > this.showCount) {
					data.hasMore = true;
					data.rest++;
					continue;
				}
				data.clients.push(clients[i]);
			}

			return data;



		},

		"actManageMandatory": function(e) {
			e.preventDefault();
			this.emit("manageMandatory");
		},

		"initLoad": function() {

			var that = this;
			return this.orgAdminClients.onLoaded()
				.then(function() {
					return that.draw();
				})
				.then(this.proxy("_initLoaded"));

		},


		"draw": function() {
			var that = this;
			var view = this.processView(this.orgAdminClients.getClients());
			view.isPlatformAdmin = this.usercontext.isPlatformAdmin();

			// console.error("About to render", view);
			return this.tmp.render(this.el, view);
		}



	}).extend(EventEmitter);


	return SimpleOrgAdminController;
});
