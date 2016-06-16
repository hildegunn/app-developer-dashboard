define(function(require, exports, module) {
	"use strict";

	var
		$ = require('jquery'),
		Controller = require('./Controller'),
		EventEmitter = require('../EventEmitter');

	// var template = require('text!templates/OrgRoleSelector.html');



	var Statistics = Controller.extend({

		"init": function(feideconnect) {
			var that = this;
			this.feideconnect = feideconnect;
			this._super(undefined, true);
		},

		"initLoad": function() {

			var that = this;
			return this.loadData()
				.then(that.proxy("_initLoaded"));
		},

		"loadData": function() {
			var that = this;
			var ep = this.app.feideconnect.config.apis.auth + '/orgs';
			return new Promise(function(resolve, reject) {
				$.getJSON(ep, function(orgs) {
					that.orgs = [];
					for (var i = 0; i < orgs.length; i++) {
						// that.orgs.push(new NorwegianOrg(orgs[i]));
						that.orgs.push(orgs[i]);
					}
					resolve();

				}).fail(function(err) {
					reject(err);
				});

			});

		}


	}).extend(EventEmitter);


	return Statistics;
});