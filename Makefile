.PHONY: build run test build-prod

build:
	npm run build

run: build
	npm run start

build-prod:
	BASE_PATH=/esther npm run build

test:
	npm run lint
