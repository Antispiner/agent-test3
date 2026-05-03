.PHONY: demo down logs build-server start-server start-nginx seed

demo: build-server start-server start-nginx

build-server:
	cd server && mvn -B package -DskipTests

start-server:
	@cd server && nohup java -jar target/ancestor-chat.jar > /tmp/ancestor-server.log 2>&1 & echo $$! > /tmp/ancestor-server.pid
	@sleep 3

start-nginx:
	docker compose up --build -d
	@echo "Open http://localhost"

down:
	-docker compose down
	-kill $$(cat /tmp/ancestor-server.pid 2>/dev/null) 2>/dev/null
	-rm -f /tmp/ancestor-server.pid /tmp/ancestor-server.log

logs:
	tail -f /tmp/ancestor-server.log

seed:
	@bash scripts/seed.sh
