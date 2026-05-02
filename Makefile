.PHONY: demo down logs seed build

demo:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

build:
	docker compose build

seed:
	@bash scripts/seed.sh
