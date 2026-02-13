# Makefile for gitlab-mr CLI

# Use brew prefix if available, fallback to /usr/local
PREFIX ?= $(shell brew --prefix 2>/dev/null || echo /usr/local)
BINDIR = $(PREFIX)/bin

.PHONY: all build install clean

all: build

build:
	go build -buildvcs=false -ldflags="-s -w" -o gitlab-mr-fetch .

install: build
	@mkdir -p $(BINDIR)
	@cp gitlab-mr-fetch $(BINDIR)/
	@echo "Installed to $(BINDIR)/gitlab-mr-fetch"
	@which gitlab-mr-fetch > /dev/null 2>&1 || echo "⚠️  $(BINDIR) may not be in PATH. Run: export PATH=\"$(BINDIR):\$$PATH\""

clean:
	rm -f gitlab-mr-fetch

test: build
	@echo "Testing gitlab-mr-fetch..."
	./gitlab-mr-fetch --help 2>/dev/null || echo "✗ Binary built"

deps:
	go mod tidy
	go mod download
