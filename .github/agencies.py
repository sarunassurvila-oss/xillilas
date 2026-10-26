# Lietuvos NT agentūrų bendri kontaktai iš jų pačių svetainių (tik bendri įmonės adresai, ne asmeniniai).
import re, sys, time, urllib.request, urllib.parse, html, csv, io
UA = {'User-Agent': 'Mozilla/5.0 (compatible; NT-agenturu-kontaktai/1.0)'}
def get(url, t=12):
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=t) as r:
            if 'html' not in (r.headers.get('content-type') or ''): return '', r.geturl()
            return r.read(600000).decode('utf-8', 'ignore'), r.geturl()
    except Exception:
        return '', url
SEED = '''capital.lt capitalrealty.eu ober-haus.lt inreal.lt centrokubas.lt ntrinka.lt resident.lt crewestate.lt realu.lt reall.lt
adomax.lt remax.lt balticsir.com newsec.lt realco.lt realta.lt savasbustas.lt pamario-nt.lt ltestate.lt eurodomus.lt domusoptima.lt'''.split()
SKIP = re.compile(r'(facebook|instagram|linkedin|youtube|google|twitter|x\.com|tiktok|aruodas|domoplius|skelbiu|kampas|alio|ntagenturos|imones|visalietuva|vz|verslo|rekvizitai|imones|1588|zebra|google|rekvizitai|info\.lt|statyba|okredo|ikontaktai|w3\.org|schema\.org|wordpress|wix|apple|microsoft|cloudflare|gstatic|jquery|cookiebot|lrytas|delfi|15min|vz\.lt|vrk|registrucentras)', re.I)
domains = []
for d in SEED:
    if d not in domains: domains.append(d)
# Įmonių katalogas: agentūrų profiliai → jų svetainių adresai.
profiles = []
for city in ['vilniuje', 'kaune', 'klaipedoje', 'siauliuose', 'panevezyje', 'alytuje', 'marijampoleje', 'utenoje', 'palangoje', 'druskininkuose', 'kedainiuose', 'mazeikiuose', 'jonavoje', 'telsiuose', 'taurageje']:
    for pg in range(1, 4):
        url = f'https://www.visalietuva.lt/imones/nekilnojamojo-turto-agenturos/{city}' + (f'/{pg}' if pg > 1 else '')
        page, _ = get(url)
        links = [urllib.parse.urljoin(url, h) for h in re.findall(r'href=["\']([^"\']*/imone/[^"\'#?]+)', page)]
        new = [l for l in dict.fromkeys(links) if l not in profiles]
        profiles += new
        time.sleep(0.4)
        if not new: break
sys.stderr.write(f'katalogo profilių: {len(profiles)}\n')
for prof in profiles[:220]:
    page, _ = get(prof)
    for h in re.findall(r'href=["\'](https?://[^"\'#?]+)', page):
        host = (urllib.parse.urlparse(h).hostname or '').lower().removeprefix('www.')
        if host and not SKIP.search(host) and host.count('.') <= 2 and host not in domains:
            domains.append(host)
    time.sleep(0.35)
sys.stderr.write(f'svetainių kandidatų: {len(domains)}\n')
GENERIC = re.compile(r'^(info|office|biuras|hello|labas|sveiki|kontaktai|kontaktas|contact|contacts|nt|sales|pardavimai|nuoma|vilnius|kaunas|klaipeda|siauliai|panevezys|alytus|marijampole|utena|palanga|admin|administracija|reception|mail|uzklausos|uzklausa|agentura|klientai|partneriai|marketingas|marketing|rinkodara|centras|pagalba|support|turtas|bustas|namai|sekretore|vadyba|ofisas|kaunas\.office|vilnius\.office)$', re.I)
EMAIL = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
out = io.StringIO(); w = csv.writer(out, delimiter=';', lineterminator='\n')
w.writerow(['Agentūra (svetainė)', 'Bendras el. paštas', 'Šaltinis'])
n_ok = 0
for d in domains[:260]:
    home, final = get('https://' + d)
    if not home: home, final = get('http://' + d)
    if not home: continue
    pages = [(home, final)]
    for h in re.findall(r'href=["\']([^"\']*(?:kontakt|contact)[^"\']*)["\']', home, re.I)[:2]:
        u = urllib.parse.urljoin(final, html.unescape(h))
        if urllib.parse.urlparse(u).hostname and d.split('.')[-2] in (urllib.parse.urlparse(u).hostname or ''):
            p, f = get(u)
            if p: pages.append((p, f))
        time.sleep(0.3)
    found, src = [], ''
    base = d.split('.')[-2]
    for p, f in pages:
        text = html.unescape(p).replace('[at]', '@').replace('(at)', '@')
        for e in EMAIL.findall(text):
            e = e.strip('.').lower()
            local, dom = e.split('@', 1)
            if base in dom and GENERIC.match(local) and e not in found and not dom.endswith(('.png', '.jpg', '.webp', '.svg')):
                found.append(e); src = src or f
    if found:
        n_ok += 1
        w.writerow([d, ', '.join(found[:4]), src])
    time.sleep(0.4)
sys.stdout.write(out.getvalue())
sys.stderr.write(f'tikrinta svetainių: {min(len(domains),260)}, su bendru el. paštu: {n_ok}\n')
