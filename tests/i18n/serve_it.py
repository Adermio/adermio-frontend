#!/usr/bin/env python3
"""Serveur local du site avec clean URLs façon Vercel (/it/home -> it/home.html). Port 8091."""
import http.server, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
class H(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p = super().translate_path(path)
        if not os.path.exists(p):
            if os.path.exists(p + '.html'): return p + '.html'
            if os.path.isdir(p) and os.path.exists(os.path.join(p, 'index.html')): return os.path.join(p, 'index.html')
        return p
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', 8091), H).serve_forever()
