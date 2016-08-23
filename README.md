[![Code Climate](https://codeclimate.com/github/feideconnect/app-developer-dashboard/badges/gpa.svg)](https://codeclimate.com/github/feideconnect/app-developer-dashboard)

# Dataporten Developer Dashboard

Manage clients and API Gatekeepers.


## Configuratioun

* Expose the web app on a web server, capable of serving static files.
* Register the web app in [Dataporten developer dashboard](https://developers.feideconnect.no)

Then rename the config from

	cp etc/config.template.js etc/config.js

And then edit the client ID and redirect URI in the `etc/config.js` configuration file.


# Build production web app

Install npm dependencies

	npm install
	npm install -g grunt-cli

Now, use grunt to build the app:

	grunt build

Thats all.




# Publishing to PaaS / Jenkins

See `deploy_jenkins.sh`


# Running App


Run app in production

	grunt lang # To update dictionaries
	grunt build
	npm start

# Run developement build


First time:

```
rm -rf dataporten-resources
git clone git@scm.uninett.no:feide-connect/dataporten-resources.git

cp -a dataporten-resources/fonts/* bower_components/uninett-bootstrap-theme/fonts
```

Run app in development mode

	NODE_ENV=development npm start


It will load all the CSS and javascript files one by one, where changes in the files will be immediately reflected in the app. It will not be that effective though, but perfect for development.

The configuration file needs to be adjusted to reflect index.dev.html as your redirect_uri:

	"redirect_uri": "http://xxxxx.example.org/index.dev.html",


# Deployment requirements


This app needs to run at the root path of your host.

The web server needs to be configured to load the proper app build depending on language negotiation.

A development version may be loaded by using the `/index.dev.html` loader instead of `index.html`. The developer version will not load load the app minified and built, but instead load the source files one by one.


# Handling translation of web app

Application is translated at:

* <https://www.transifex.com/organization/erlang/dashboard/feide-connect>

The source dictionary is located at `dictionaries/dictionary.en.json`.

Downloading completed transaltions is done by:

	grunt lang

Then multi-lingual app packs are built automatically.



## Behind the scene of the grunt build

If you are curious on what `grunt build` does behind the scene, it can be replaced by the following commands:

	npm install -g bower
	bower install
	r.js -o build.css.js
	r.js -o build.js



# Updating

To update current version from current active git branch:

	git pull
	npm install
	grunt build
