#!/bin/bash

_npm() {
	npm --prefix=$ENGINE $@
}

_link_dir() {
	mkdir -p $1
	rm -rf "$ENGINE/$1"
	ln -s "../$1" "$ENGINE/$1"
}

_init() {
	_link_dir public
	_link_dir out
	_npm install
}

dev() {
	_init
	_npm run dev
}

build() {
	_init
	_npm run build
	_npm run export
}

source env.sh
set -xe

"$@"
