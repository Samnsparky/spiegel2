all: lint test
	cd src;
	mkdir -p build
	cd src; zip -r ../build/app.zip ./*
	mv ./build/app.zip ./build/app.nw

lint:
	cd src; jshint ./

test:
	nodeunit ./src/*_test.js

clean:
	rm -r ./build