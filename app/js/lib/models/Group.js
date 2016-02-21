define(function(require, exports, module) {
	"use strict";

	var
		Model = require('./Model');

	var Group = Model.extend({


		"isType": function(type) {
			if (!this.has("type")) {
				return false;
			}
			return this.type === type;
		},

		"isMemberType": function(type) {
			if (!this.has("membership")) {
				return false
			}
			if (!this.membership.hasOwnProperty("basic")) {
				return false;
			}
			return this.membership.basic === type;
		},

		"getTitle": function() {
			if (this.orgName) {
				return this.orgName;
			}
			return 'na';
		},
		"getView": function() {
			var res = this._super();
			return res;
		}

	});

	return Group;

});