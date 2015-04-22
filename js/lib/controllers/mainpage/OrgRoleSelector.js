define(function(require, exports, module) {
	"use strict";

	var 
		$ = require('jquery'),
		Controller = require('../Controller'),
		dust = require('dust'),
		EventEmitter = require('../../EventEmitter')
		
		;

	var template = require('text!templates/OrgRoleSelector.html');



	var OrgRoleSelector = Controller.extend({
		"init": function(el) {

			var that = this;

			this._super(el);

			this.roles = {};
			this.currentRole = '_';

			dust.loadSource(dust.compile(template, "OrgRoleSelector"));

			this.ebind("click", ".orgSelector a", "actSelect");


		},

		"getOrg": function() {
			if (this.currentRole === '_') { return null; }
			console.error("Get role is not _ but [" + this.currentRole + "]");
			return this.currentRole;
		},

		"actSelect": function(e) {
			e.preventDefault();

			var ct = $(e.currentTarget);
			var orgid = ct.closest("li").data("orgid");
			ct.closest("ul").children().removeClass("active");
			ct.closest("li").addClass("active");
			console.error("Selected", orgid);

			if (this.currentRole !== orgid) {
				this.currentRole = orgid;
				var toBroadcast = (orgid === '_' ? null : orgid);
				this.emit("orgRoleSelected", toBroadcast);
			}

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
			// console.error("View s ", view);
			return new Promise(function(resolve, reject) {
				dust.render("OrgRoleSelector", view, function(err, out) {
					if (err) {return reject(err);}
					that.el.empty().append(out);
					return resolve();
				});
			});
		},

		"initLoad": function() {

			var that = this;

			return new Promise(function(resolve, reject) {

				setTimeout(function() {

					that.roles = {
						"_" : "Personal",
						"fc:org:uninett.no": "UNINETT AS",
						"fc:org:sigmund": "Sigmund AS"
					};
					resolve();

				}, 200);

			})
				.then(this.proxy("draw"))
				.then(that.proxy("_initLoaded"));
		}

	}).extend(EventEmitter);


	return OrgRoleSelector;
});