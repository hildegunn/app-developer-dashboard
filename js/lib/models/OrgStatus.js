define(function(require, exports, module) {
	"use strict";	

	var 
		Model = require('./Model')
		;

	var OrgStatus = Model.extend({
		"init": function(props) {
			this._super(props);

			this.geocount = 0;
			this.s = this.getServices();


			// if (Math.random() > 0.4) { this.s.Contract = true; }
			// if (Math.random() > 0.9) { this.s.FS = true; }
			// if (Math.random() > 0.97) { this.s.PeopleSearch = true; }

			this.calculateScore();
		},
		"calculateScore": function() {
			this.score = 0;
			var scores = {
				'pilot': 100,
				'avtale': 100,
				'auth': 70,
				'PeopleSearch': 10,
				'LDAP': 10,
				'FS': 10,
				'Geo': 4,
				'Logo': 4
			};

			for(var key in scores) {
				if (this.hasService(key)) {
					this.score += scores[key];
				}
			}

		},
		"isOfType": function(type) {
			if (!this.has("type")) {
				return false;
			}
			if (this.type === null) {
				// console.error("This has type of null", this);
				return false;
			}
			// console.log("Type", this.type);
			for(var i = 0; i < this.type.length; i++) {
				if (type === this.type[i]) {
					return true;
				}
			}
			return false;
		},
		"hasService": function(s) {
			return (this.s.hasOwnProperty(s));
		},
		"getServices": function() {
			var services = {};
			if (this.services) {
				for(var i = 0; i < this.services.length; i++) {
					services[this.services[i]] = true;
				}
			}
			if (this.has_peoplesearch) {
				services.PeopleSearch = true;
			}
			if (this.has_ldapgroups) {
				services.LDAP = true;
			}
			if (this.fs_groups) {
				services.FS = true;
			}
			if (this.has("uiinfo") && this.uiinfo !== null) {
				services.Geo = true;
				// console.error("Geo loength: ", this.uiinfo.geo.length);
				this.geocount = this.uiinfo.geo.length;
			}
			if (this.has("hasLogo") && this.uiinfo !== null) {
				services.Logo = true;
			}

			return services;
		},
		"getView": function() {
			var res = this._super();
			res.s = this.getServices();
			return res;
		}
	});

	OrgStatus.scoreSorter = function(a, b) {
		return +(a.score < b.score) || +(a.score === b.score) - 1;
	};

	return OrgStatus;

});

