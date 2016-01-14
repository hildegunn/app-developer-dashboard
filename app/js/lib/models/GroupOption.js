define(function(require, exports, module) {
	"use strict";	


	var 
		Model = require('./Model')
		;

	var GroupOption = Model.extend({

		"isOrgType": function(type) {

			if (!this.group) {return false; }
			if (!this.group.orgType) {return false; }
			for(var i = 0; i < this.group.orgType.length; i++) {
				if (this.group.orgType[i] === type) {
					return true;
				}
			}
			return false;

		},

		"getID": function() {
			if (this.id) { return this.id; }
			if (this.group && this.group.org) {return this.group.org; }
			throw new Error("Could not get identifier for this groupoption.");
		},

		"getTitle": function() {
			if (this.title) {return this.title; }
			if (this.group && this.group.orgName) { return this.group.orgName; }
			return 'na';
		},

		"getView": function() {
			var res = this._super();

			if (this.id === '_') {
				res.icon = 'fa fa-user';
			} else if(this.isOrgType("home_organization")) {
				res.icon = 'fa fa-home';
			} else if(this.isOrgType("service_provider")) {
				res.icon = 'fa fa-suitcase';
			} else {
				res.icon = 'fa fa-circle-o';
			}

			if (this.group) {
				res.group = this.group.getView();
				res.id = this.getID();
				res.title = this.group.orgName;
			}
			return res;
		}
		
	});

	return GroupOption;

});