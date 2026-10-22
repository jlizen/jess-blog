"""Check the HTML and image assets that link-preview crawlers receive."""

from html.parser import HTMLParser
from pathlib import Path
import struct
import sys
from urllib.parse import unquote, urlsplit


class Head(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = {}
        self.links = {}
        self.redirect = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            if attrs.get("http-equiv", "").lower() == "refresh":
                self.redirect = True
            key = attrs.get("property", attrs.get("name"))
            self.meta.setdefault(key, []).append(attrs.get("content", ""))
        elif tag == "link":
            self.links.setdefault(attrs.get("rel"), []).append(attrs.get("href", ""))


def check(root):
    pages = list(root.rglob("*.html"))
    if not pages:
        raise ValueError(f"No built pages in {root}")
    for page in pages:
        head = Head()
        head.feed(page.read_text().split("</head>", 1)[0])
        if head.redirect or "noindex" in head.meta.get("robots", []):
            continue
        for key in ("og:title", "og:description", "og:url", "og:image"):
            values = head.meta.get(key, [])
            if len(values) != 1 or not values[0].strip():
                raise ValueError(f"{page}: expected one nonempty {key}")
        description = head.meta["og:description"][0]
        if description.startswith("This was pulled from") or len(description) < 40:
            raise ValueError(f"{page}: description needs a useful excerpt")
        if head.links.get("canonical") != head.meta["og:url"]:
            raise ValueError(f"{page}: canonical and Open Graph URLs differ")
        base = urlsplit(head.meta["base"][0])
        image = urlsplit(head.meta["og:image"][0])
        prefix = base.path.rstrip("/") + "/"
        if image.scheme != "https" or image.netloc != base.netloc or not image.path.startswith(prefix):
            raise ValueError(f"{page}: preview image must use the public site URL")
        image_path = root / unquote(image.path[len(prefix):])
        data = image_path.read_bytes()
        if data[:8] != b"\x89PNG\r\n\x1a\n":
            raise ValueError(f"{page}: preview image must be PNG")
        width, height = struct.unpack(">II", data[16:24])
        if width < 1200 or height < 627 or len(data) >= 5_000_000:
            raise ValueError(f"{page}: preview image does not meet LinkedIn dimensions/size")
        if head.meta.get("og:image:width") != [str(width)] or head.meta.get("og:image:height") != [str(height)]:
            raise ValueError(f"{page}: image dimensions in metadata differ from the asset")
    print(f"Link previews checked for {len(pages)} HTML pages.")


if __name__ == "__main__":
    check(Path(sys.argv[1] if len(sys.argv) > 1 else "public"))
