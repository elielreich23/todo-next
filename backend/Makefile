.PHONY: help install test lint format check migrate run clean

help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make test       - Run tests"
	@echo "  make lint       - Run linting checks"
	@echo "  make format     - Format code with black and isort"
	@echo "  make check      - Run all checks (lint, format check, tests)"
	@echo "  make migrate     - Run database migrations"
	@echo "  make run        - Run development server"
	@echo "  make clean      - Clean up cache and temporary files"

install:
	pip install -r requirements.txt
	pip install black flake8 isort pytest pytest-django pytest-cov

test:
	pytest --verbose --cov=. --cov-report=term-missing

lint:
	flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

format:
	black .
	isort .

format-check:
	black --check .
	isort --check-only .

check: format-check lint
	python manage.py check --deploy
	python manage.py makemigrations --check --dry-run

migrate:
	python manage.py migrate

run:
	python manage.py runserver

clean:
	find . -type d -name __pycache__ -exec rm -r {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name "*.egg-info" -exec rm -r {} +
	rm -rf .pytest_cache
	rm -rf .coverage
	rm -rf htmlcov
	rm -rf dist
	rm -rf build

