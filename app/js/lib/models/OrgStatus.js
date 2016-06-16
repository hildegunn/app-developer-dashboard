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
			// if (Math.random() > 0.9) { this.s.fsgroups = true; }
			// if (Math.random() > 0.97) { this.s.PeopleSearch = true; }

			this.calculateScore();
		},
		"calculateScore": function() {
			this.score = 0;
			var scores = {
				'avtale': 100,
				'auth': 70,
				'PeopleSearch': 10,
				'LDAP': 10,
				'fsgroups': 10,
				'Geo': 4,
				'Logo': 4,
				"idporten": 5
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

		"getMapURL": function() {
			var base = "http://maps.google.com/maps/api/staticmap?zoom=12&size=512x512&maptype=roadmap&";
			// "markers=color:blue|label:S|40.702147,-74.015794&markers=color:green|label:G|40.711614,-74.012318&markers=color:red|color:red|label:C|40.718217,-73.998284";
			var url = base;
			var items = [];

			if (this.has("uiinfo") && this.uiinfo !== null) {
				url += 'center=' + encodeURIComponent(this.uiinfo.geo[0].lat)+ ',' + encodeURIComponent(this.uiinfo.geo[0].lon) + '&';
				for(var i = 0; i < this.uiinfo.geo.length; i++) {
					items.push('markers=color:blue|label:' + (encodeURIComponent(this.uiinfo.geo[i].title) || i) + '|' + encodeURIComponent(this.uiinfo.geo[i].lat)+ ',' + encodeURIComponent(this.uiinfo.geo[i].lon));
				}
				url += items.join('&');
			} else {
				return null;
			}

			return url;
		},

		"getGeoTxt": function() {

			return JSON.stringify(this.uiinfo.geo, undefined, 4);

		},

		"getView": function() {
			var res = this._super();
			res.s = this.getServices();
			res.mapurl = this.getMapURL();
			return res;
		}
	});

	OrgStatus.scoreSorter = function(a, b) {
		return +(a.score < b.score) || +(a.score === b.score) - 1;
	};

	return OrgStatus;

});

