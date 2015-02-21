[![Code Climate](https://codeclimate.com/github/feideconnect/app-developer-dashboard/badges/gpa.svg)](https://codeclimate.com/github/feideconnect/app-developer-dashboard)

# Feide Connect Developer Dashboard	

Manage clients and API Gatekeepers.


## Configuratioun

* Expose the web app on a web server, capable of serving static files.
* Register the web app in [Feide Connect developer dashboard](https://developers.feideconnect.no)

Then rename the config from 

	cp etc/config.template.js etc/config.js

And then edit the client ID and redirect URI in the `etc/config.js` configuration file.


# Run developement build

You can now already use the development version, by loading

	http://example.org/index.dev.html

It will load all the CSS and javascript files one by one, where changes in the files will be immediately reflected in the app. It will not be that effective though, but perfect for development.

The configuration file needs to be adjusted to reflect index.dev.html as your redirect_uri:

	"redirect_uri": "http://xxxxx.example.org/index.dev.html",

# Build production web app

Install npm dependencies

	npm install
	npm install -g grunt-cli

Now, use grunt to build the app:

	grunt build

Thats all.


## Behind the scene of the grunt build

If you are curious on what `grunt build` does behind the scene, it can be replaced by the following commands:
	
	npm install -g bower
	bower install
	r.js -o build.css.js
	r.js -o build.js







