"""Kiểm tra báo cáo tuần 2–3 đối chiếu phạm vi dự án, không xác nhận ngày hoàn thành code."""
from pathlib import Path
from zipfile import ZipFile
import re
from lxml import etree
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships','a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
W=NS['w'];tag=lambda n:f'{{{W}}}{n}'
text=lambda p:''.join(p.xpath('.//w:t/text()',namespaces=NS))
roles={'ADMIN','STUDENT','LECTURER','DEAN'}
schema=(ROOT/'prisma/schema.prisma').read_text(encoding='utf-8')
assert set(re.search(r'enum Role\s*\{([^}]+)',schema).group(1).split())==roles
expected_ids=['01','02','03','04','05','06','09','10','13','16','18']
models=set(re.findall(r'^model (\w+)',schema,re.M))
for week,filename in [(2,'BaoCaoTuan2_TLCN_sat_du_an.docx'),(3,'BaoCaoTuan3_TLCN_bo_sung_database.docx')]:
 with ZipFile(ROOT/'docs/reports'/filename) as z:
  assert z.testzip() is None
  root=etree.fromstring(z.read('word/document.xml'));body=root.find(tag('body'));tables=body.findall(tag('tbl'))
  assert len(tables)==(7 if week==2 else 6)
  metadata=text(tables[0]);assert 'Nguyễn Văn Sang' in metadata and 'Phạm Minh Nhật' in metadata and 'Ths. Đoàn Thanh Phong' in metadata
  assert ('14/10/2026' if week==2 else '21/10/2026') in metadata
  role_rows=tables[1].findall(tag('tr'))[1:];assert len(role_rows)==4
  assert {re.search(r'\((\w+)\)',text(row)).group(1) for row in role_rows}==roles
  dean=next(text(row) for row in role_rows if '(DEAN)' in text(row))
  assert 'không duyệt đợt' in dean and 'không thêm giảng viên' in dean
  feature_rows=tables[2].findall(tag('tr'))[1:]
  codes=[text(row.findall(tag('tc'))[0]) for row in feature_rows]
  assert codes==[(('CN-' if week==2 else 'UC-')+i) for i in expected_ids]
  for row in feature_rows:
   t=text(row).lower()
   for invented in ['giải trình','kế hoạch cải thiện','xử lý phản ánh','nhắc khảo sát thông minh','phân tích xu hướng','ban giám hiệu','hội đồng']:
    assert invented not in t,(week,invented)
  if week==3:
   assert all(f'CN-{i}:' in text(row) for i,row in zip(expected_ids,feature_rows))
   details=text(tables[3])
   assert 'riêng đợt đánh giá giảng viên' in details and 'chưa có gửi email' in details.lower()
   assert 'chưa tính là đã lập trình xong' in text(body)
   assert len(root.xpath('//w:drawing',namespaces=NS))==2
   assert z.read('word/media/database-diagram.svg')==(ROOT/'docs/database/database-diagram.svg').read_bytes()
   assert root.xpath('//*[local-name()="svgBlip"]/@r:embed',namespaces=NS)==['rIdFullDatabaseSvg']
   assert z.read('word/media/week3-database.png')==(ROOT/'docs/reports/database-tuan3.png').read_bytes()
   assert len(root.xpath('//w:sectPr',namespaces=NS))==2
  else:
   assert 'chưa phải báo cáo chức năng đã lập trình' in text(body)
   for name in re.findall(r'\b[A-Z][A-Za-z]+\b',text(tables[6])):
    if name not in ['Nhóm','Các','Tài','Thiết','Giao','Thông']:assert name in models,name
  original=Path(f'C:/ChatGPT/BaoCaoTuan{week}_TLCN.docx')
  if original.exists():
   with ZipFile(original) as source:
    for name in source.namelist():
     if name not in ['word/document.xml','word/_rels/document.xml.rels','[Content_Types].xml']:assert z.read(name)==source.read(name),name
# Anchor the reported behavior to implementation files; these checks supplement manual review.
for path,needle in [
 ('src/modules/academic/permissions.ts','roles.includes("ADMIN")'),
 ('src/modules/survey-campaign/input.ts','["COURSE","LECTURER"]'),
 ('src/modules/survey-campaign/audience.ts','participationTeaching.createMany'),
 ('src/modules/response/service.ts','Bạn đã hoàn thành khảo sát này.'),
 ('src/modules/reporting/report.ts','responses < minimum'),
 ('src/modules/templates/manage.ts','CREATE_VERSION'),
 ('src/modules/notifications/service.ts','"PUBLISHED" | "CLOSED"'),
 ('src/app/api/reports/campaigns/[id]/export/route.ts','text/csv')]:
 assert needle in (ROOT/path).read_text(encoding='utf-8'),path
refs=set(re.findall(r'Ref: (\w+)\.\w+ > (\w+)\.\w+',(ROOT/'docs/database/database-web.dbml').read_text(encoding='utf-8')))
edges=etree.parse(str(ROOT/'docs/reports/database-tuan3.svg')).xpath('//*[@data-parent]');assert len(edges)==16
for edge in edges:assert (edge.get('data-child'),edge.get('data-parent')) in refs
with Image.open(ROOT/'docs/reports/database-tuan3.png') as image:assert image.width>=3000
print('PASS: hai báo cáo, bốn vai trò, 11 chức năng/Use Case, tên bảng, sơ đồ và căn cứ code.')
