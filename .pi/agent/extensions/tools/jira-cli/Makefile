# Makefile for jira-cli tools

PREFIX ?= $(HOME)
BINDIR = $(PREFIX)/bin

.PHONY: all build install clean

all: build

build:
	go build -buildvcs=false -ldflags="-s -w" -o jira-fetch .

install: build
	mkdir -p $(BINDIR)
	cp jira-fetch $(BINDIR)/
	@echo "Installed to $(BINDIR)/jira-fetch"

clean:
	rm -f jira-fetch

test: build
	@echo "Testing jira-fetch..."
	./jira-fetch --help 2>/dev/null || echo "✗ Binary built"

deps:
	go mod tidy
	go mod download
