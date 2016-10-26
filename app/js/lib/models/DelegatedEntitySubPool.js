define(function(require, exports, module) {
	"use strict";	

	var 
		ClientPool = require('./ClientPool'),
		EventEmitter = require('../EventEmitter')
		;

	var DelegatedEntitySubPool = ClientPool.extend({
		"init": function(data) {
			this._super(null, null);
			this.apigks = data.apigks;
			this.clients = data.clients;
			this.clientRequests = data.clientRequests;
		},

		"initLoad": function() {
			this._initLoaded();
			this.emit('clientChange', this.clients);
			this.emit('apigkChange', this.apigks);
		}

	}).extend(EventEmitter);

	return DelegatedEntitySubPool;

});
