define(function(require, exports, module) {

	"use strict";	

	var 

		Class = require('../class'),
		EventEmitter = require('../EventEmitter'),

		Client = require('./Client'),
		APIGK = require('./APIGK')
		;


	var PublicClientPool = Class.extend({
		"init": function(feideconnect) {

			var that = this;
			this.feideconnect = feideconnect;

			this.apigks = {};
			this.apigksLoaded = false;

			this.feideconnect.clientsPublicList(function(apigks) {

				// console.log("Loaded public set of apis", apigks);
				var i;
				for (i = 0; i < apigks.length; i++) {
					that.apigks[apigks[i].id] = new APIGK(apigks[i]);
				}
				if (!that.apigksLoaded) {that.emit("ready", that.apigks);}
				that.apigksLoaded = true;
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


		"ready": function(callback) {
			if (this.apigksLoaded) {
				callback(this.apigks);
			} else {
				this.on("ready", callback);
			}
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
			// console.error("DELETE APIGK", id);
			this.emit("apigkChange", this.apigks);
		}

	}).extend(EventEmitter);


	return PublicClientPool;

});

