#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function rebuild_dist () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?

  local ORIG_BRANCH="$(git branch | sed -nre 's~^\* ~~p')"
  case "$ORIG_BRANCH" in
    experimental | \
    master ) ;;
    * )
      echo E: "Expected to run from branch master or experimental," \
        "not '$ORIG_BRANCH'!"
      return 4;;
  esac
  git status --short | grep . && return 4$(echo E: 'Worktree is unclean.' >&2)

  ./rebuild.sh || return $?
  ghpages-autodist-bundles || return $? # from git-util-pmb
}


rebuild_dist "$@"; exit $?
