#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function rebuild () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local REPO_DIR="$(readlink -m "$BASH_SOURCE"/../..)"
  exec </dev/null
  cd -- "$REPO_DIR" || return $?

  eslint . || return $?

  cd build || return $?

  local BFN='pre2gfm'
  local DBG="$BFN".debug.js
  browserify --standalone "$BFN" -- "$BFN".js \
    | tee -- "$DBG" \
    | uglifyjs \
    | tee -- ../dist/"$BFN".min.js \
    | gzip --stdout >../dist/"$BFN".min.js.gz
  local PIPE_RV="${PIPESTATUS[*]}"
  let PIPE_RV="${PIPE_RV// /+}"
  [ "$PIPE_RV" == 0 ] || return "$PIPE_RV"

  check_hljs_unicode_properties || return $?

  cd -- "$REPO_DIR" || return $?
  du --human-readable -- dist/*.js.gz || true
}


function check_hljs_unicode_properties () {
  local BAD='\p{XID'
  grep -m 1 --color=always -HinFe "$BAD" -- "$DBG" || return 0
  local HLJS='s~,$~~; s~^ +("highlight\.js")~\1~p'
  HLJS="$(sed -nre "$HLJS" -- "$REPO_DIR"/package.json)"
  echo E: "^-- /$BAD/ breaks some old browsers." \
    "It probably comes from dependency $HLJS." \
    'Try downgrading it to 10.x.' >&2
  return 4
}













[ "$1" == --lib ] && return 0; rebuild "$@"; exit $?
