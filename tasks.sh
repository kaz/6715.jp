#!/bin/bash

OUTPUT_DIR="out"
ENGINE_DIR="nextjs-blog-scaffold"

_npm() {
	npm --prefix=$ENGINE_DIR "$@"
}
_git() {
	git -C $OUTPUT_DIR "$@"
}

_link_dir() {
	mkdir -p $1
	rm -rf "$ENGINE_DIR/$1"
	ln -s "../$1" "$ENGINE_DIR/$1"
}

_init() {
	_link_dir $OUTPUT_DIR
	_link_dir public
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

deploy() {
	rm -rf "$OUTPUT_DIR/.git"
	printf $BLOG_HOST > $OUTPUT_DIR/CNAME
	_git init
	_git add -A
	_git config user.email "$GITHUB_ACTOR@users.noreply.github.com"
	_git config user.name "$GITHUB_ACTOR"
	_git commit -m "built from $GIT_COMMIT_SHA"
	_git push -f $GIT_REMOTE HEAD:$GIT_BRANCH
}

source env.sh
set -xe

"$@"
