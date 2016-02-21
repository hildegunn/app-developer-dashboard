define(function(require, exports, module) {
	"use strict";

	var
		$ = require('jquery'),
		Controller = require('./Controller'),

		Model = require('../models/Model'),
		Group = require('../models/Group'),
		GroupOption = require('../models/GroupOption'),
		EventEmitter = require('../EventEmitter'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine');

	var template = require('text!templates/OrgRoleSelector.html');



	var OrgRoleSelector = Controller.extend({

		"init": function(el, usercontext, app) {

			var that = this;
			this.usercontext = usercontext;
			this.app = app;

			this._super(el);

			this.enabled = true; // If set to false,it will only show if member of one or more org

			this.groups = null;

			this.platformadmin = false;
			this.roles = {};
			this.currentRole = '_';

			this.tmp = new TemplateEngine(template, this.app.dict);

			this.ebind("click", ".orgSelector a", "actSelect");

		},

		"initLoad": function() {

			var that = this;
			that.roles = {};
			that.roles._ = new GroupOption({
				"id": "_",
				"title": "Personal"
			});

			this.setOrg(this.currentRole, false);

			return this.usercontext.onLoaded()
				.then(function() {

					if (that.usercontext.platformadmin !== null) {
						that.roles._platformadmin = new GroupOption({
							"id": "_platformadmin",
							"title": "Platform admin"
						});
					}

					for (var orgid in that.usercontext.groups) {

						that.roles[orgid] = new GroupOption({
							"group": that.usercontext.groups[orgid]
						});
					}

					console.log("usercontext", that.usercontext);
					console.log("roles", that.roles);

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
			for (var key in this.roles) {
				keys.push(key);
			}
			return keys;
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
			var view = {
				"roles": []
			};

			for (var key in this.roles) {
				var re = this.roles[key].getView();
				re.classes = [];
				if (this.currentRole === key) {
					re.classes = 'active';
				}
				view.roles.push(re);
			}

			if (!this.enabled) {
				return;
			}

			console.log("Roles", view);

			return this.tmp.render(this.el.empty(), view);
		}



	}).extend(EventEmitter);


	return OrgRoleSelector;
});