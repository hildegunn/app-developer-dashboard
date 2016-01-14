define(function(require, exports, module) {
	"use strict";

	var 
		$ = require('jquery'),
		Controller = require('./Controller'),

		Model = require('../models/Model'),
		Group = require('../models/Group'),
		EventEmitter = require('../EventEmitter'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine')
		;

	var template = require('text!templates/OrgRoleSelector.html');


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



	var OrgRoleSelector = Controller.extend({

		"init": function(el, feideconnect, app) {

			var that = this;
			this.feideconnect = feideconnect;
			this.app = app;

			this._super(el);

			this.enabled = false;

			this.roles = {};
			this.currentRole = '_';

			console.error("Dict is ", this.app.dict);

			this.tmp = new TemplateEngine(template, this.app.dict);

			this.ebind("click", ".orgSelector a", "actSelect");

		},

		"initLoad": function() {

			var that = this;
			that.roles = {};
			that.roles._ = new GroupOption({"id": "_", "title": "Personal"});

			this.setOrg(this.currentRole, false);

			return that.feideconnect.vootGroupsList()
				.then(function(groups) {

					for(var i = 0; i < groups.length; i++) {

						var g = new Group(groups[i]);

						// Only use group memberships where a user is admin in an orgadmin group.
						if (!g.isType("fc:orgadmin")) { continue; }
						if (!g.isMemberType("admin")) { continue; }

						// console.error("GROUP ", g);
						that.enabled = true;
						that.roles[groups[i].org] = new GroupOption({"group": g});
					}

				})
				.then(this.proxy("draw"))
				.then(that.proxy("_initLoaded"));

		},

		"getRole": function(orgid) {
			// console.error("Getting role for ", orgid, this.roles[orgid]);
			return this.roles[orgid];
		},
		"getCurrentRole": function(orgid) {
			return this.getRole(this.currentRole);
		},

		"getOrg": function() {
			// if (this.currentRole === '_') { return null; }
			// console.error("Get role is not _ but [" + this.currentRole + "]");
			return this.currentRole;
		},

		"getOrgIdentifiers": function() {

			var keys = [];
			for(var key in this.roles) {
				keys.push(key);
			}
			return keys;
		},


		"getOrgInfo": function(orgid) {
			if (orgid === '_') { return null; }

			var c = this.feideconnect.getConfig();
			// console.error("Config was", c);

			// console.log("Getting orginfo for " + orgid, this.roles);
			var orgInfo = {
				"id": orgid,
				"displayName": this.roles[orgid].getTitle(),
				"logoURL": c.apis.core + '/orgs/' + orgid + '/logo'
			};

			return orgInfo;
		},

		"setOrg": function(orgid, notify) {

			notify = (notify !== false);

			var orgidraw = (orgid === null ? "_" : orgid);
			var toBroadcast = (orgid === '_' ? null : orgid);

			var p = this.el.find('.orgSelector');
			p.children().removeClass("active");
			p.children().each(function(i, item) {

				if ($(item).data("orgid") === orgidraw) {
					$(item).addClass("active");
				} else {
					$(item).removeClass("active");
				}
			});

			if (this.currentRole !== orgidraw) {
				this.currentRole = orgid;
				if (notify) {
					this.emit("orgRoleSelected", orgidraw);	
				}
			}

		},

		"actSelect": function(e) {
			e.preventDefault();

			var ct = $(e.currentTarget);
			var orgid = ct.closest("li").data("orgid");

			// console.error("SetOrg", orgid);

			this.setOrg(orgid, true);

		},

		"hide": function() {
			this.el.hide();
		},

		"show": function() {
			this.el.show();
		},


		"draw": function() {
			var that = this;

			var view = {
				"roles": []
			};


			for(var key in this.roles) {
				// var re = {
				// 	"id": key,
				// 	"title": this.roles[key],
				// 	"classes": ''
				// };
				var re = this.roles[key].getView();
				re.classes = [];
				if (this.currentRole === key) {
					re.classes = 'active';
				}
				view.roles.push(re);
			}

			if (!this.enabled) {return;}
			
			// alert("boo");

			return this.tmp.render(this.el.empty(), view);

			// return new Promise(function(resolve, reject) {
			// 	dust.render("OrgRoleSelector", view, function(err, out) {
			// 		if (err) {return reject(err);}
			// 		that.el.empty().append(out);
			// 		return resolve();
			// 	});
			// });
		}



	}).extend(EventEmitter);


	return OrgRoleSelector;
});