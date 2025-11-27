.PHONY: check
check:
	npm --prefix web run check && npm --prefix server run check

IMAGE_NAME=ai-chat

.PHONY: docker-build
docker-build:
	docker build -t $(IMAGE_NAME) .

.PHONY: docker-run
docker-run:
	docker run -it -p 5174:5174 $(IMAGE_NAME)