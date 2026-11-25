from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse, unquote
import re
root=Path('dist'); prefix='/LightX2V-Website/'; errors=[]
class Links(HTMLParser):
 def __init__(self): super().__init__(); self.links=[]; self.base=None
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if tag=='base': self.base=attrs.get('href')
  for key in ('href','src','poster'):
   if key in attrs and tag!='base': self.links.append(attrs[key])
for file in root.rglob('*.html'):
 parser=Links();parser.feed(file.read_text());relative=file.relative_to(root).as_posix()
 for link in parser.links:
  if link.startswith(('#','data:','mailto:','tel:','javascript:')):continue
  url=urlparse(urljoin('https://local.test'+(parser.base or prefix+relative),link))
  if url.netloc!='local.test':continue
  if not url.path.startswith(prefix):errors.append(f'{relative}: escapes project path: {link}');continue
  target=root/unquote(url.path[len(prefix):])
  if target.is_dir(): target=target/'index.html'
  if not target.is_file(): errors.append(f'{relative}: missing {link}')
for file in root.rglob('*'):
 if file.is_file() and file.stat().st_size>=100*1024*1024:errors.append(f'File exceeds GitHub 100 MiB limit: {file}')
for file in root.rglob('*.js'):
 text=file.read_text()
 if re.search(r"['\"]/showcase-|['\"]/milestones\.en",text):errors.append(f'Unprefixed dynamic media: {file}')
assert not (root/'CNAME').exists(), 'Project site must inherit the organization domain'
assert (root/'.nojekyll').exists()
if errors:raise SystemExit('\n'.join(errors))
print('PASS: local HTML assets, project paths, dynamic media and file sizes')
