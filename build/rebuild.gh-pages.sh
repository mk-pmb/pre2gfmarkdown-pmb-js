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
  cd .. || return $?

  local GHP_WT="tmp.gh-pages.$EPOCHSECONDS.$RANDOM"
  git worktree add "$GHP_WT" || return $?
  cd -- "$GHP_WT" || return $?

  local DEST_BRANCH='gh-pages'
  local ON_DEST="on the $DEST_BRANCH branch"
  sed -re '/^# .* only '"$ON_DEST"':$/,/^#/s~^/~# &~' \
    -i dist/.gitignore || return $?
  git commit dist -m "Adjust dist/.gitignore for use $ON_DEST." || return $?
  cp --verbose --target-directory=dist/ -- ../dist/[a-z]* || return $?
  git add dist || return $?
  git commit -m "Add extra dist files $ON_DEST." || return $?
  git push origin HEAD:"$DEST_BRANCH" --force || return $?

  cd .. || return $?
  git worktree remove --force "$GHP_WT" || return $?
  git branch -D "$GHP_WT" || return $?
}


rebuild_dist "$@"; exit $?
