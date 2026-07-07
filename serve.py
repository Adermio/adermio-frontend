import http.server
import os

os.chdir(os.path.join(os.path.dirname(__file__), '..'))
http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler, port=3456, bind='0.0.0.0')
