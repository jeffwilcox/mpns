
TESTS = test/*.js
REPORTER = spec
DOX = ./node_modules/.bin/dox

SRC = $(shell find lib/*.js)

test:
	@./node_modules/.bin/mocha -u tdd
