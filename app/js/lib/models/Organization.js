define(function(require, exports, module) {
	"use strict";

	var
		Model = require('./Model');

	var Organization = Model.extend({
		
		"getView": function() {
			var res = this._super();
			return res;
		},
		"matchType": function(type) {
			if (!this.type) {
				return false;
			}
			for(var i = 0; i < this.type.length; i++) {
				if (this.type[i] === type) {
					return true;
				}
			}
			return false;
		},

		"matchService": function(srv) {
			if (!this.services) {
				return false;
			}
			for(var i = 0; i < this.services.length; i++) {
				if (this.services[i] === srv) {
					return true;
				}
			}
			return false;
		},

		"matchFilter": function(filter) {
			if (!filter) {
				return true;
			}
			
			if (filter.service) {
				if (!this.matchService(filter.service)) {
					return false;
				}
			}

			if (filter.type) {
				if (!this.matchType(filter.type)) {
					return false;
				}
			}
			return true;
		}

	});

	return Organization;

});