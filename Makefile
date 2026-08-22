.PHONY: build run test build-prod

build:
	npm run build

run: build
	npm run start

build-prod:
	NEXT_PUBLIC_BASE_PATH=/esther npm run build

test:
	npm run lint