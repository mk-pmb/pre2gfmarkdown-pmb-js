#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function rebuild () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?

  local BFN='pre2gfm'
  browserify --standalone "$BFN" -- "$BFN".js \
    | tee -- "$BFN".debug.js \
    | uglifyjs \
    | tee -- ../dist/"$BFN".min.js \
    | gzip --stdout >../dist/"$BFN".min.js.gz
  local PIPE_RV="${PIPESTATUS[*]}"
  let PIPE_RV="${PIPE_RV// /+}"
  [ "$PIPE_RV" == 0 ] || return "$PIPE_RV"

  cd ..
  du --human-readable -- dist/*.js.gz || true
}


[ "$1" == --lib ] && return 0; rebuild "$@"; exit $?
