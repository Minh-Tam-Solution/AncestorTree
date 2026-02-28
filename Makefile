# @project AncestorTree
# @file Makefile
# @description Convenient Docker commands for building and running the app.
# @version 1.0.0
# @updated 2026-02-28
#
# Prerequisites: Docker + Docker Compose, .env file (copy from .env.docker.example)
#
# Quick start:
#   cp .env.docker.example .env   # fill in SUPABASE credentials
#   make deploy                    # build + start

ENV_FILE ?= .env
COMPOSE   = docker compose --env-file $(ENV_FILE)

.DEFAULT_GOAL := help

# ─── Help ─────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "  AncestorTree — Docker commands"
	@echo "  ────────────────────────────────────────────────────────────────────"
	@echo "  make deploy    Build (smart cache) then start the container"
	@echo "  make rebuild   Build WITHOUT any cache, then start the container"
	@echo "  make fresh     Bust source-code cache only (deps layer stays cached)"
	@echo "                 Use after code changes when lock file is unchanged"
	@echo "  ────────────────────────────────────────────────────────────────────"
	@echo "  make start     Start existing containers (no build)"
	@echo "  make stop      Stop containers (data is preserved)"
	@echo "  make restart   Restart the app container"
	@echo "  make logs      Follow live container logs"
	@echo "  make ps        Show container status"
	@echo "  make shell     Open a shell inside the running container"
	@echo "  ────────────────────────────────────────────────────────────────────"
	@echo "  make clean     Stop + remove containers and locally built images"
	@echo "  make clean-all Stop + remove containers, images, and volumes"
	@echo ""

# ─── Build & Deploy ───────────────────────────────────────────────────────────

## Smart build: Docker reuses cached layers (deps) when lock file is unchanged.
## Source-code changes always invalidate the COPY . . layer → fresh pnpm build.
deploy:
	$(COMPOSE) build
	$(COMPOSE) up -d --force-recreate
	@echo ""
	@echo "  Container started. Logs: make logs"
	@echo ""

## Full rebuild: --no-cache clears ALL layers (reinstalls deps + rebuilds).
## Use when you suspect corrupted cache, or after major dependency upgrades.
rebuild:
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d --force-recreate
	@echo ""
	@echo "  Container rebuilt (no cache). Logs: make logs"
	@echo ""

## Source-bust: injects a timestamp ARG before COPY . . to invalidate only the
## source-code + build layers. The pnpm install layer stays cached, saving time.
## Use after code changes when pnpm-lock.yaml has NOT changed.
fresh:
	$(COMPOSE) build --build-arg BUILD_DATE=$$(date +%s)
	$(COMPOSE) up -d --force-recreate
	@echo ""
	@echo "  Container updated with fresh source build. Logs: make logs"
	@echo ""

# ─── Container management ─────────────────────────────────────────────────────

start:
	$(COMPOSE) up -d

stop:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart app

logs:
	$(COMPOSE) logs -f app

ps:
	$(COMPOSE) ps

shell:
	docker exec -it ancestortree-web sh

# ─── Cleanup ──────────────────────────────────────────────────────────────────

clean:
	$(COMPOSE) down --rmi local

clean-all:
	$(COMPOSE) down --rmi local --volumes

.PHONY: help deploy rebuild fresh start stop restart logs ps shell clean clean-all
