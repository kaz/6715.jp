#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"

task="${1:-dev}"
if [[ $# -gt 0 ]]; then shift; fi
case "$task" in
  dev|build|preview|test|typecheck)
    exec bun run "$task" "$@"
    ;;
  deploy)
    : "${GITHUB_ACTOR:?Set GITHUB_ACTOR for deployment}"
    : "${GIT_REMOTE:?Set GIT_REMOTE for deployment}"
    test -f dist/client/index.html
    deployment_dir="$(mktemp -d)"
    trap 'rm -rf -- "$deployment_dir"' EXIT
    cp -R dist/client/. "$deployment_dir/"
    git -C "$deployment_dir" init --quiet
    git -C "$deployment_dir" config user.email "$GITHUB_ACTOR@users.noreply.github.com"
    git -C "$deployment_dir" config user.name "$GITHUB_ACTOR"
    git -C "$deployment_dir" add -A
    git -C "$deployment_dir" commit --quiet -m "built from ${GIT_COMMIT_SHA:-local}"
    git -C "$deployment_dir" push --quiet --force "$GIT_REMOTE" "HEAD:${GIT_BRANCH:-gh-pages}"
    ;;
  *)
    printf 'Unknown task: %s\n' "$task" >&2
    exit 1
    ;;
esac
