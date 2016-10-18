define(function(require, exports, module) {

	"use strict";	

	var 

		Class = require('../class'),
		EventEmitter = require('../EventEmitter'),
		Controller = require('../controllers/Controller'),
		APIGK = require('./APIGK')
		;


	var PublicAPIPool = Controller.extend({
		"init": function(feideconnect) {
			var that = this;
			this.feideconnect = feideconnect;
			this.apigks = {};

			this._super(undefined, true);
		},

		"initLoad": function() {
			return this.load()
				.then(this.proxy("_initLoaded"));
		},

		"load": function() {
			var that = this;
			that.apigks = {};
			return that.feideconnect.apigkPublicList()
				.then(function(apigks) {
					var i;
					for (i = 0; i < apigks.length; i++) {
						that.apigks[apigks[i].id] = new APIGK(apigks[i]);
					}
					that.emit('apigkChange', that.apigks);
				});
		},

		"getView": function() {

			var items = [];
			for(var key in this.apigks) {
				var x = this.apigks[key];
				x.id = key;
				items.push(x.getView());
			}
			return items;
		},


		"setAPIGK": function(apigk) {
			this.apigks[apigk.id] = apigk;
			this.emit("apigkChange", this.apigks);
		},
		"getAPIGK": function(id) {
			if (this.apigks.hasOwnProperty(id)) {return this.apigks[id];}
			return null;
		},
		"removeAPIGK": function(id) {
			delete this.apigks[id];
			this.emit("apigkChange", this.apigks);
		}

	}).extend(EventEmitter);


	return PublicAPIPool;

});

