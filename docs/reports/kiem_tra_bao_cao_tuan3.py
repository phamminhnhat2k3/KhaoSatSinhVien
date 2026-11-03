"""Kiểm tra nội dung và cấu trúc báo cáo tuần 3; chạy bằng Python của workspace dependencies."""
from pathlib import Path
from zipfile import ZipFile
import re
from lxml import etree
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
REPORT=ROOT/'docs/reports/BaoCaoTuan3_TLCN_bo_sung_database.docx'
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships','a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
with ZipFile(REPORT) as z:
 assert z.testzip() is None
 root=etree.fromstring(z.read('word/document.xml'))
 texts=root.xpath('//w:t/text()',namespaces=NS)
 content=' '.join(texts)
 for expected in ['7. Thiết kế cơ sở dữ liệu sơ bộ','7.1. Các nhóm dữ liệu và nguyên tắc thiết kế','8. Kết quả tuần 3 và định hướng tuần 4','Nguyễn Văn Sang','Phạm Minh Nhật','Ths. Đoàn Thanh Phong','21/10/2026','ngoài hệ thống','Tuần 4 bắt đầu thiết lập Next.js','không chứa khóa sinh viên']:
  assert expected in content,expected
 assert len(root.xpath('//w:body/w:tbl',namespaces=NS))==6
 assert len(root.xpath('//w:drawing',namespaces=NS))==1
 assert root.xpath('//a:blip/@r:embed',namespaces=NS)==['rIdWeek3Database']
 assert 'word/media/week3-database.png' in z.namelist()
 assert z.read('word/media/week3-database.png')==(ROOT/'docs/reports/database-tuan3.png').read_bytes()
 original=Path('C:/ChatGPT/BaoCaoTuan3_TLCN.docx')
 if original.exists():
  with ZipFile(original) as source:
   for name in source.namelist():
    if name not in ['word/document.xml','word/_rels/document.xml.rels','[Content_Types].xml']:
     assert z.read(name)==source.read(name),f'Đã thay đổi phần không liên quan: {name}'
svg=etree.parse(str(ROOT/'docs/reports/database-tuan3.svg'))
edges=svg.xpath('//*[@data-parent]')
assert len(edges)==16
refs=set(re.findall(r'Ref: (\w+)\.\w+ > (\w+)\.\w+',(ROOT/'docs/database/database-web.dbml').read_text(encoding='utf-8')))
for e in edges:assert (e.get('data-child'),e.get('data-parent')) in refs
assert not any(e.get('data-parent')=='StudentProfile' and e.get('data-child')=='Submission' for e in edges)
with Image.open(ROOT/'docs/reports/database-tuan3.png') as image:
 assert image.width>=3000 and image.height>=2900
print('PASS: nội dung, ảnh nhúng, 16 quan hệ dữ liệu và định dạng gốc được giữ đúng.')
