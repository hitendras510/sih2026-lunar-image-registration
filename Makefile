.PHONY: setup test run api ui demo docker-build docker-up docker-down

setup:
	conda env create -f environment.yml

test:
	pytest tests/ -q

api:
	uvicorn api.main:app --reload --port 8000

ui:
	cd ui && npm install && npm run dev -- --port 5173

run:
	selene run --src $(SRC) --ref $(REF) --out $(OUT)

demo:
	python scripts/precompute_showcase.py

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

