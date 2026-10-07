"""Serve the local portfolio without retaining stale preview assets."""

import argparse
import posixpath
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


class PreviewHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        path = posixpath.normpath(unquote(urlsplit(self.path).path))
        if path not in ("/", "/index.html", "/style.css", "/script.js") and not path.startswith("/assets/"):
            self.send_error(404)
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        # Preview must reflect disk even when a tab sends an old validator.
        for header in ("If-Modified-Since", "If-None-Match"):
            if header in self.headers:
                del self.headers[header]
        super().do_GET()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--directory", default=str(Path(__file__).resolve().parent))
    parser.add_argument("--bind", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    handler = partial(PreviewHandler, directory=args.directory)
    ThreadingHTTPServer((args.bind, args.port), handler).serve_forever()
