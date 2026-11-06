"""Kiểm tra nội dung và định dạng bản tổng hợp chức năng ngày 06/11/2026."""
from pathlib import Path
from zipfile import ZipFile
from datetime import date
import re
import subprocess
from lxml import etree

ROOT=Path(__file__).resolve().parents[2]
FILE=ROOT/'docs/reports/Tong_hop_chuc_nang_theo_ngay_06_11_2026.docx'
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
text=lambda node: ''.join(node.xpath('.//w:t/text()',namespaces=NS))
with ZipFile(FILE) as z:
 assert z.testzip() is None
 body=etree.fromstring(z.read('word/document.xml'))
 content=text(body)
 assert ';' not in content
 assert 'vitrung65' not in content
 assert not body.xpath('//w:drawing|//w:pBdr',namespaces=NS)
 for expected in ['lịch sử Git','không phải lịch phân bổ','chỉ xem kết quả','75 sinh viên','mỗi lớp học 4 môn','119 bài test','23 kịch bản','dữ liệu thật']:
  assert expected in content,expected
 headers=[text(p) for p in body.xpath('//w:p[w:pPr/w:pStyle[@w:val="Heading2"]]',namespaces=NS)]
 dates=[date(int(y),int(m),int(d)).isoformat() for h in headers for d,m,y in re.findall(r'^Ngày (\d+) tháng (\d+) năm (\d+)$',h)]
 assert len(dates)==13 and dates==sorted(set(dates)),dates
 git_dates=subprocess.check_output(['git','-c','safe.directory=C:/KhaoSatSinhVien','log','--format=%ad','--date=short'],cwd=ROOT,text=True).splitlines()
 assert set(dates)<=set(git_dates)
 assert not body.xpath('//w:tbl',namespaces=NS)
 paragraphs=[text(p) for p in body.xpath('//w:body/w:p',namespaces=NS)]
 bullets=[t for t in paragraphs if t.startswith('- ')]
 assert len(bullets)>=50
 assert all(len(t.split())<=30 for t in bullets)
 assert len([t for t in bullets if t.startswith('- Đã làm — ')])==14
 assert len([t for t in bullets if t.startswith('- Chưa làm — ')])==8
 assert len(content.split())<1700
 for xml in [body,etree.fromstring(z.read('word/styles.xml'))]:
  for color in xml.xpath('//w:color/@w:val',namespaces=NS):
   assert color in ['000000','auto'],color
 styles=etree.fromstring(z.read('word/styles.xml'))
 assert not styles.xpath('//w:pBdr',namespaces=NS)
 assert '- Chưa làm — Đăng nhập tài khoản trường' in content
 assert 'Trưởng khoa chỉ xem kết quả của khoa mình' in content
print('PASS: 13 Git dates, 14 completed groups, 8 planned items, concise bullets, black text, no password or decorations.')
