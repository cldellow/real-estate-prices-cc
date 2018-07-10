#!/usr/bin/env python3

"""Deletes comments, script tags, style tags, link tags from WARC bodies."""

from io import BytesIO
import sys
import re
from warcio.archiveiterator import ArchiveIterator
from warcio.warcwriter import WARCWriter
from warcio.recordloader import ArcWarcRecord

def parse(in_name, out_name):
    """Parse the WARC, strip it, write it."""
    nuke_re = r'<script.*?>.*?</script>|<style.*?>.*?</style>|<link.*?>|<!--.*?-->|style=".*?"|<img.*?>|<input.*?>|</input.*?>|<label.*?>|</label.*?>|<noscript.*?>.*?</noscript>|<svg.*?>.*?</svg>|<select.*?>.*?</select>|glyphicon-[a-z-]*|glyphicon'
    nuke_re2 = r'<div[^>]*>[\s\n\t]*?</div>'
    nuke_re3 = r'[\s\n\t][\s\n\t]*'
    i = 0
    with open(in_name, 'rb') as stream:
        for record in ArchiveIterator(stream):
            print(record.rec_headers.get_header('WARC-Target-URI'))
            n = str(i)
            while len(n) < 4:
                n = '0' + n
            with open(out_name + '/' + n + '.html', 'wb') as output:
                _bytes = record.raw_stream.read()
                try:
                    contents = _bytes.decode("utf-8")
                except UnicodeDecodeError:
                    contents = _bytes.decode("windows-1252")
                contents = re.sub(nuke_re,
                                  ' ',
                                  contents,
                                  0,
                                  re.DOTALL | re.MULTILINE)
                contents = re.sub(nuke_re2, ' ', contents, 0, re.DOTALL | re.MULTILINE)
                contents = re.sub(nuke_re3, ' ', contents, 0, re.DOTALL | re.MULTILINE)
                contents = contents + '\n'
                _bytes = bytes(contents, 'utf-8')
                output.write(_bytes)
            i = i + 1

if __name__ == '__main__':
    parse(sys.argv[1], sys.argv[2])
