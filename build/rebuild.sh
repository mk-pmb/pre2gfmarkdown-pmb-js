#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function rebuild () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local REPO_DIR="$(readlink -m "$BASH_SOURCE"/../..)"
  exec </dev/null
  cd -- "$REPO_DIR" || return $?

  [[ ",$BUILD_FLAGS," == *,nolint,* ]] || eslint . || return $?

  cd -- build || return $?

  local HLJS_VER=11
  local HLJS_MIN="tmp.cdn.hljs.v$HLJS_VER.min.js"
  ensure_cdn_hljs || return $?

  local DIST_FN='pre2gfm.min.js'
  nodejs build.js || return $?
  cat -- "$HLJS_MIN" tmp."$DIST_FN" |
    tee -- ../dist/"$DIST_FN" | gzip --stdout >../dist/"$DIST_FN".gz
  local PIPE_RV="${PIPESTATUS[*]}"
  let PIPE_RV="${PIPE_RV// /+}"
  [ "$PIPE_RV" == 0 ] || return "$PIPE_RV"

  check_hljs_unicode_properties || return $?

  cd -- "$REPO_DIR" || return $?
  du --human-readable -- dist/*.js.gz || true
}


function check_hljs_unicode_properties () {
  local BAD='\p{XID|\)\s*=>'
  grep -m 1 --color=always -HinFe "$BAD" -- tmp."$DIST_FN" || return 0
  local HLJS='s~,$~~; s~^ +("highlight\.js")~\1~p'
  HLJS="$(sed -nre "$HLJS" -- "$REPO_DIR"/package.json)"
  echo E: "^-- /$BAD/ breaks some old browsers." \
    "It probably comes from dependency $HLJS." \
    'Try downgrading it to 10.x.' >&2
  return 4
}


function ensure_cdn_hljs () {
  [ -s "$HLJS_MIN" ] && return 0 || true
  local URL='https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@'
  URL+="$HLJS_VER/build/highlight.min.js"
  local TMPF="tmp.dl-$$.$HLJS_MIN"
  wget --output-document="$TMPF" -- "$URL" || return $?
  mv --verbose --no-target-directory -- "$TMPF" "$HLJS_MIN" || return $?
}













[ "$1" == --lib ] && return 0; rebuild "$@"; exit $?
