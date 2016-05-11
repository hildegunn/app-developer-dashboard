define(function(require, exports, module) {

	"use strict";	

	var 

		Class = require('../class'),
		EventEmitter = require('../EventEmitter'),
		Controller = require('../controllers/Controller'),
		Organization = require('./Organization')
		;


	var OrganizationPool = Controller.extend({
		"init": function(feideconnect) {
			var that = this;
			this.feideconnect = feideconnect;
			this.orgs = {};

			this._super(undefined, true);
		},

		"initLoad": function() {
			return this.load()
				.then(this.proxy("_initLoaded"));
		},

		"load": function() {
			var that = this;
			that.apigks = {};
			return that.feideconnect.getOrgs()
				.then(function(items) {
					var i;
					for (i = 0; i < items.length; i++) {
						that.orgs[items[i].id] = new Organization(items[i]);
					}
					that.emit('orgChange', that.orgs);
				});
		},

		"getView": function(filter) {

			var items = [];
			for(var key in this.orgs) {
				var x = this.orgs[key];
				x.id = key;
				if (x.matchFilter(filter)) {
					items.push(x.getView());	
				}
				
			}
			return items;
		},


		"ready": function(callback) {
			throw new Error("Ready() deprecated");
		},

		"setOrg": function(org) {
			this.orgs[org.id] = org;
			this.emit("orgChange", this.orgs);
		},
		"getOrg": function(id) {
			if (this.orgs.hasOwnProperty(id)) {return this.orgs[id];}
			return null;
		},
		"removeOrg": function(id) {
			delete this.orgs[id];
			this.emit("orgChange", this.orgs);
		}

	}).extend(EventEmitter);


	return OrganizationPool;

});

