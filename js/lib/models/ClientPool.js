define(function(require, exports, module) {


	var 
		// $ = require('jquery'),
		Class = require('../class'),
		EventEmitter = require('../EventEmitter'),

		Client = require('./Client'),
		APIGK = require('./APIGK')

		;


	var ClientPool = Class.extend({
		"init": function(feideconnect) {

			var that = this;

			this.feideconnect = feideconnect;

			this.apigks = {};
			this.clients = {};

			this.apigksLoaded = false;
			this.clientsLoaded = false;

			this.feideconnect.apigkList(function(apigks) {

				console.log("APIgks", apigks);
				var i;
				for (i = 0; i < apigks.length; i++) {
					that.apigks[apigks[i].id] = new APIGK(apigks[i]);
				}
				that.emit('apigkChange', that.apigks);
				that.apigksLoaded = true;
				if (that.clientsLoaded) that.emit('ready');


			});

			this.feideconnect.clientsList(function(clients) {

				console.log("clients", clients);
				var i;
				for (i = 0; i < clients.length; i++) {
					that.clients[clients[i].id] = new Client(clients[i]);
				}
				that.emit('clientChange', that.clients);
				that.clientsLoaded = true;
				if (that.apigksLoaded) that.emit('ready');

			});


		},
		"ready": function(callback) {
			if (this.apigksLoaded && this.clientsLoaded) {
				callback();
			} else {
				this.on("ready", callback);
			}
		},
		"setClient": function(client) {
			this.clients[client.id] = client;
			this.emit("clientChange", this.clients);
		},
		"setAPIGK": function(apigk) {
			this.apigks[apigk.id] = apigk;
			this.emit("apigkChange", this.apigks);
		},
		"removeClient": function(id) {
			delete this.clients[id];
			this.emit("clientChange", this.clients);
		},
		"getClient": function(id) {
			if (this.clients.hasOwnProperty(id)) return this.clients[id];
			return null;
		},
		"getAPIGK": function(id) {
			if (this.apigks.hasOwnProperty(id)) return this.apigks[id];
			return null;
		},
		"removeAPIGK": function(id) {
			delete this.apigks[id];
			console.error("DELETE APIGK", id);
			this.emit("apigkChange", this.apigks);
		}

	}).extend(EventEmitter);

	// ClientPool.extend(EventEmitter);

	return ClientPool;





// var ClientPool = function(items) {


// 	if (items) {
// 		this.addItems(items);	
// 	}

// };


// ClientPool.prototype.addItem = function(item) {
// 	this.items[item.id] = item;
// };
// ClientPool.prototype.addItems = function(items) {

// 	var i;
// 	for(i = 0; i < items.length; i++) {
// 		this.items[items[i].id] = items[i];
// 	}

// };

// ClientPool.prototype.get = function(id) {
// 	if (this.items.hasOwnProperty(id)) {
// 		return this.items[id];
// 	}
// 	return null;
// }

// return ClientPool;





});

