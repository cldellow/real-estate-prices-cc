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
                    try:
                        contents = _bytes.decode("windows-1252")
                    except UnicodeDecodeError:
                        print('unable to parse')
                        next

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

                output.write("""<script>(function(){var s=document.createElement('div');s.innerHTML='Loading...';s.style.color='black';s.style.padding='20px';s.style.position='fixed';s.style.zIndex='9999';s.style.fontSize='3.0em';s.style.border='2px solid black';s.style.right='40px';s.style.top='40px';s.setAttribute('class','selector_gadget_loading');s.style.background='white';document.body.appendChild(s);s=document.createElement('script');s.setAttribute('type','text/javascript');s.setAttribute('src','http://localhost:8000/js/bootstrap.js?' + (new Date()).getTime() );document.body.appendChild(s);})();</script>""".encode('utf-8'))
            i = i + 1

if __name__ == '__main__':
    parse(sys.argv[1], sys.argv[2])
