define(function(require, exports, module) {
	"use strict";

	var
		$ = require('jquery'),
		Controller = require('./Controller'),
		EventEmitter = require('../EventEmitter');

	var ProviderData = Controller.extend({

		"init": function(app) {
			var that = this;
			this.app = app;
			this._super(undefined, true);
		},

		"initLoad": function() {

			var that = this;
			return this.loadData()
				.then(this.proxy("loadDataExtra"))
				.then(that.proxy("_initLoaded"));

		},


		"loadData": function() {
			var that = this;
			var ep = this.app.feideconnect.config.apis.auth + '/orgs';
			return new Promise(function(resolve, reject) {
				$.getJSON(ep, function(orgs) {
					that.orgs = [];
					for (var i = 0; i < orgs.length; i++) {
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
			var ep = this.app.feideconnect.config.apis.auth + '/accountchooser/extra';
			return new Promise(function(resolve, reject) {
				$.getJSON(ep, function(extra) {
					that.extra = [];
					for (var i = 0; i < extra.length; i++) {
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