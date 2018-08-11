#!/bin/bash

# Given a WARC file, use warctools and some heuristics to filter it to only
# records likely to contain responsive material.

set -euo pipefail

file=${1:?must provide warc to filter}

filter() {
  fltr=${1:?must provide regex}
  echo "Filter: $fltr"
  warcfilter "$fltr" "$file" | pv -cN output-bytes | tee tmp2 | grep '^WARC-Type: response' --line-buffered --text | pv -l -cN output-records > /dev/null
  mv tmp2 tmp
  file=tmp
}

filter '\$ *[0-9][0-9][0-9],[0-9][0-9][0-9]'
filter '(?i)\bbed\b|\bbeds\b|\bbedroom|\bbed room'
filter '(?i)\bbath\b|\bbaths\b|\bbathroom|\bbath room'
