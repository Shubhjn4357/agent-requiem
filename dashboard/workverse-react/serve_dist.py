from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent / "dist"
os.chdir(ROOT)

server = ThreadingHTTPServer(("127.0.0.1", 4174), SimpleHTTPRequestHandler)
server.serve_forever()
