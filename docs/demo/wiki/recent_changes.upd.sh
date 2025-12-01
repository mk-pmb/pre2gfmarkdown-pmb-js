#!/bin/sh
# -*- coding: utf-8, tab-width: 2 -*-
( echo '<?xml version="1.0" encoding="utf-8"?>'
  echo -n '<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">'
  echo '<channel><title>Recent Changes</title>'
  for M in *.md; do
    LC_TIME=C git log -n 1 --format='%at  <item><pubDate>%aD</pubDate>' -- "$M"
    echo "<title>$M</title><link>https://example.test/?$M</link></item>"
  done | sed -re 's~, ([1-9] )~, 0\1~;N;s~\n~~' | sort -g | sed -re 's~^\S+~~'
  echo '</channel></rss>'
) | tee -- recent_changes.rss
