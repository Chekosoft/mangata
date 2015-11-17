#!/bin/bash
if python3 -c ''; then
    python3 -m http.server 8000
elif python2 -c ''; then
    python2 -m SimpleHTTPServer 8000
else
    print "Es necesario python.exe"
fi
