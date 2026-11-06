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
 tables=body.xpath('//w:tbl',namespaces=NS)
 assert len(tables)==2
 for table,count,state in zip(tables,[27,8],['Đã làm','Chưa làm']):
  rows=table.xpath('./w:tr',namespaces=NS)
  assert len(rows)==count+1
  assert rows[0].xpath('./w:trPr/w:tblHeader',namespaces=NS)
  for i,row in enumerate(rows[1:],1):
   cells=row.xpath('./w:tc',namespaces=NS)
   assert len(cells)==3 and text(cells[0])==str(i)
   assert text(cells[2])==state
 for xml in [body,etree.fromstring(z.read('word/styles.xml'))]:
  for color in xml.xpath('//w:color/@w:val',namespaces=NS):
   assert color in ['000000','auto'],color
 styles=etree.fromstring(z.read('word/styles.xml'))
 assert not styles.xpath('//w:pBdr',namespaces=NS)
 assert 'Đăng nhập tài khoản trường' in text(tables[1])
 assert 'Trưởng khoa xem báo cáo thuộc khoa mình' in text(tables[0])
print('PASS: 13 Git dates, 27 completed functions, 8 planned items, black text, no password or decorations.')
