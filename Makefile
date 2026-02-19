.PHONY: up down logs build clean

# Start all services (postgres + backend + frontend) in Docker
up:
	docker compose up -d --build

# Stop all services
down:
	docker compose down

# Stop all services and remove volumes (fresh start)
clean:
	docker compose down -v

# View logs from all services
logs:
	docker compose logs -f

# View logs from a specific service (usage: make log-backend, make log-frontend, make log-db)
log-%:
	docker compose logs -f $*
