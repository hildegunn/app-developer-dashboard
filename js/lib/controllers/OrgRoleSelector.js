define(function(require, exports, module) {
	"use strict";

	var 
		$ = require('jquery'),
		Controller = require('./Controller'),
		dust = require('dust'),
		EventEmitter = require('../EventEmitter')
		
		;

	var template = require('text!templates/OrgRoleSelector.html');



	var OrgRoleSelector = Controller.extend({
		"init": function(el, feideconnect) {

			var that = this;
			this.feideconnect = feideconnect;

			this._super(el);

			this.enabled = false;

			this.roles = {};
			this.currentRole = '_';

			dust.loadSource(dust.compile(template, "OrgRoleSelector"));

			this.ebind("click", ".orgSelector a", "actSelect");


		},


		"initLoad": function() {

			var that = this;
			that.roles = {
				"_" : "Personal",
				// "fc:org:uninett.no": "UNINETT AS",
				// "fc:org:sigmund": "Sigmund AS"
			};

			this.setOrg(this.currentRole, false);

			return that.feideconnect.vootGroupsList()
				.then(function(groups) {
					// console.error("Groups", groups);

					for(var i = 0; i < groups.length; i++) {
						if (groups[i].type !== 'fc:orgadmin') {continue; }
						if (groups[i].membership.basic !== 'admin') {continue; }

						that.enabled = true;
						that.roles[groups[i].org] = groups[i].orgName;
					}

				})
				.then(this.proxy("draw"))
				.then(that.proxy("_initLoaded"));

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

			var orgInfo = {
				"id": orgid,
				"displayName": this.roles[orgid],
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
				// console.error("PROCESSING ", item);
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
			// ct.closest("ul").children().removeClass("active");
			// ct.closest("li").addClass("active");

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
				var re = {
					"id": key,
					"title": this.roles[key],
					"classes": ''
				};
				if (this.currentRole === key) {
					re.classes = 'active';
				}
				view.roles.push(re);
			}

			if (!this.enabled) {return;}

			// console.error("View s ", view);
			return new Promise(function(resolve, reject) {
				dust.render("OrgRoleSelector", view, function(err, out) {
					if (err) {return reject(err);}
					that.el.empty().append(out);
					return resolve();
				});
			});
		}



	}).extend(EventEmitter);


	return OrgRoleSelector;
});