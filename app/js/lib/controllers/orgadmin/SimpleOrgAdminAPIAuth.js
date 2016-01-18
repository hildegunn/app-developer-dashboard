define(function(require, exports, module) {
	"use strict";

	var 
		$ = require('jquery'),
		Controller = require('../Controller'),
		EventEmitter = require('../../EventEmitter'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine')

		;

	var template = require('text!templates/SimpleOrgAdminAPI.html');



	var SimpleOrgAdminAPIAuth = Controller.extend({
		"init": function(feideconnect, orgAdminAPIs) {

			var that = this;
			this.feideconnect = feideconnect;
			this.orgAdminAPIs = orgAdminAPIs;

			this.showCount = 3;

			this._super();

			this.tmp = new TemplateEngine(template);

			this.ebind("click", ".actManageAPIAuth", "actManageAPIAuth");

		},

		"processView": function(apis) {

			// var clients = [];
			// for(var key in clientsobj) {
			// 	clients.push(clientsobj[key]);
			// }

			var data = {
				"clients": [],
				"hasClients": false,
				"count": 0,
				"hasMore": false,
				"rest": 0
			};

			if (apis.length === 0) {
				return data;
			}

			data.count = apis.length;
			data.hasClients = true;

			for(var i = 0; i < apis.length; i++) {
				if (i > this.showCount) {
					data.hasMore = true;
					data.rest++;
					continue;
				}
				data.clients.push(apis[i]);
			}

			return data;



		},

		"actManageAPIAuth": function(e) {
			e.preventDefault();
			this.emit("manageAPIAuth");
		},

		"initLoad": function() {
			// console.error("ORG LOAD ...");
			var that = this;
			return this.orgAdminAPIs.onLoaded()
				.then(function() {
					return that.draw();
				})
				.then(this.proxy("_initLoaded"));

		},


		"draw": function() {

			var that = this;
			// console.error("DRWA");
			var view = this.processView(this.orgAdminAPIs.getClients());

			// console.error("About to render", view);
			return this.tmp.render(this.el, view);
		}



	}).extend(EventEmitter);


	return SimpleOrgAdminAPIAuth;
});