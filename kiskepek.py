# Kisképek (640 px) a galériához és a kártyákhoz: public/img/opt/thumb/
# Futtatás új képek után:  python3 kiskepek.py   (Pillow kell hozzá)
# A build.mjs a kisképet srcset-ben használja, ha létezik; ha nincs, az eredetit.
import json, os
from PIL import Image
R = os.path.dirname(os.path.abspath(__file__))
OPT = os.path.join(R, 'public', 'img', 'opt')
TH = os.path.join(OPT, 'thumb')
os.makedirs(TH, exist_ok=True)
cat = json.load(open(os.path.join(R, 'data', 'by-category.json')))
kell = {x['file'] for l in cat.values() for x in l}
for f in kell:
    cel = os.path.join(TH, f)
    if os.path.exists(cel):
        continue
    im = Image.open(os.path.join(OPT, f)).convert('RGB')
    im.thumbnail((640, 640), Image.LANCZOS)
    im.save(cel, 'WEBP', quality=76)
for f in os.listdir(TH):
    if f not in kell:
        os.remove(os.path.join(TH, f))
print(len(kell), 'kiskép kész')
