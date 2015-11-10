define(function(require, exports, module) {
	"use strict";

	var
		Model = require('./Model');

	function normalizeEndpoint(name, attrs) {
		var endpoint = attrs;
		endpoint.name = name;
		endpoint.OK = (endpoint.result === "success");
		return endpoint;
	}



	var LDAPStatus = Model.extend({
		"init": function(props) {
			this._super(props);

			this.endpoints = this.getEndpoints();
		},
		"getEndpoints": function() {
			var endpoints = [];
			for (var server in this.data) {
				endpoints.push(normalizeEndpoint(server, this.data[server]));
			}
			return endpoints;
		},
		"getView": function() {
			var res = this._super();
			res.endpoints = this.getEndpoints();
			res.OK = res.endpoints.length > 0 && res.endpoints.every(function(ep) {
				return ep.OK;
			});
			if (res.endpoints.length === 0) {
				res.message = "Ingen LDAP-server funnet";
			}
			return res;
		}
	});

	return LDAPStatus;

});