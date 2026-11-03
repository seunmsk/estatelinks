"""Builds public/ from the design preview in ../el. Run: python3 build.py"""
import re, shutil, pathlib
SRC = pathlib.Path(__file__).resolve().parent.parent / "el"
OUT = pathlib.Path(__file__).resolve().parent / "public"
page = (SRC / "index.html").read_text(encoding="utf-8")
head_end = page.index("</style>") + len("</style>")
head, body = page[:head_end], page[head_end:]
head = re.sub(r"<title>.*?</title>", "", head, count=1)
head = head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")
body = re.sub(r'<div class="strip">.*?</div></div>\n', "", body, count=1, flags=re.S)
doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Estate Links | Estate Surveyors &amp; Valuers, Lagos</title>
<meta name="description" content="Estate Links and Gbenga Olaniyan &amp; Associates: property valuation, sales, lettings, management and investment in Lagos, Abuja, the UK and the USA since 1993.">
<meta property="og:title" content="Estate Links | Estate Surveyors &amp; Valuers">
<meta property="og:description" content="Property valuation, sales, lettings, management and investment since 1993.">
<meta property="og:image" content="/img/h/trinity.jpg">
<link rel="icon" href="/mark.png">
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
{head.strip()}
</head>
<body>{body}</body>
</html>
"""
OUT.mkdir(exist_ok=True)
(OUT / "index.html").write_text(doc, encoding="utf-8")
for f in ["logo.png", "logo-dark.png", "mark.png"]:
    shutil.copy(SRC / f, OUT / f)
if (OUT / "img").exists(): shutil.rmtree(OUT / "img")
shutil.copytree(SRC / "img", OUT / "img")
print("built", OUT)
