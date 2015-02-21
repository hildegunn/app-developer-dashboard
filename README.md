[![Code Climate](https://codeclimate.com/github/feideconnect/app-developer-dashboard/badges/gpa.svg)](https://codeclimate.com/github/feideconnect/app-developer-dashboard)

# Feide Connect Developer Dashboard	

Manage clients and API Gatekeepers.


## Configuratioun

Edit OAuth settings in `etc/config.js`.



# Build process


Install npm dependencies, such as `bower` and `grunt`. Then install bower packages, and build and optimize requirejs javascript and css.

	npm install
	bower install
	r.js -o build.css.js
	r.js -o build.js


## Development

Development is performed using `index.dev.html` which loads each js file separatly.





