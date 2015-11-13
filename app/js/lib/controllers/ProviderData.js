define(function(require, exports, module) {
	"use strict";

	var
		$ = require('jquery'),
		Controller = require('./Controller'),
		EventEmitter = require('../EventEmitter');

	// var template = require('text!templates/OrgRoleSelector.html');



	var ProviderData = Controller.extend({

		"init": function(app) {
			var that = this;
			this._super(undefined, true);
			this.app = app;

		},

		"initLoad": function() {

			var that = this;
			return this.loadData()
				.then(this.proxy("loadDataExtra"))
				.then(that.proxy("_initLoaded"));

		},


		"loadData": function() {
			var that = this;

			return new Promise(function(resolve, reject) {

				$.getJSON('https://auth.feideconnect.no/orgs', function(orgs) {

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


		},

		"loadDataExtra": function() {
			var that = this;
			return new Promise(function(resolve, reject) {

				// console.error("extra load", that.app.feideconnect.config);

				$.getJSON('https://auth.feideconnect.no/accountchooser/extra', function(extra) {
					that.extra = [];
					for (var i = 0; i < extra.length; i++) {
						// that.extra.push(new Provider(extra[i]));
						that.extra.push(extra[i]);
					}
					resolve();

				}).fail(function(err) {
					reject(err);
				});
			});

		}


	}).extend(EventEmitter);


	return ProviderData;
});