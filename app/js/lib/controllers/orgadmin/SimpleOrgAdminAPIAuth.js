define(function(require, exports, module) {
	"use strict";

	var 
		Controller = require('../Controller'),
		EventEmitter = require('../../EventEmitter'),
		Dictionary = require('../../Dictionary'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine')

		;

	var template = require('text!templates/SimpleOrgAdminAPI.html');



	var SimpleOrgAdminAPIAuth = Controller.extend({

		"init": function(feideconnect, orgAdminAPIs) {
			this.feideconnect = feideconnect;
			this.orgAdminAPIs = orgAdminAPIs;

			this.showCount = 3;

			this._super();
			this.dict = new Dictionary();
			this.tmp = new TemplateEngine(template, this.dict);

			this.ebind("click", ".actManageAPIAuth", "actManageAPIAuth");

		},

		"processView": function(apis) {

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
			// console.error("DRWA");
			var view = this.processView(this.orgAdminAPIs.getClients());

			// console.error("About to render", view);
			return this.tmp.render(this.el, view);
		}



	}).extend(EventEmitter);


	return SimpleOrgAdminAPIAuth;
});
