install-deps:
	npm ci

lint:
	npx eslint .

test:
	npm test

test-coverage:
	npm run test:coverage

.PHONY: test
