"""Kiểm tra báo cáo tuần 4 và lịch dự kiến, không biến kế hoạch thành kết quả đã hoàn thành."""
from datetime import date,timedelta
from pathlib import Path
from zipfile import ZipFile
import json,re,subprocess
from lxml import etree

ROOT=Path(__file__).resolve().parents[2]
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W=NS['w'];tag=lambda n:f'{{{W}}}{n}'
text=lambda p:''.join(p.xpath('.//w:t/text()',namespaces=NS))
with ZipFile(ROOT/'docs/reports/BaoCaoTuan4_TLCN.docx') as z:
 assert z.testzip() is None
 root=etree.fromstring(z.read('word/document.xml'));body=root.find(tag('body'));content=text(body)
 for expected in ['BÁO CÁO CÔNG VIỆC TUẦN 4','28/10/2026','22–28/10','MVP đã có từ 19/10','Tại mốc 28/10, hệ thống mới có ba vai trò','Kế hoạch này cập nhật ngày 03/11','Nguyễn Văn Sang','Phạm Minh Nhật','Ths. Đoàn Thanh Phong']:
  assert expected in content,expected
 assert '94' not in content
 assert len(root.xpath('//w:drawing',namespaces=NS))==0
 tables=body.findall(tag('tbl'));assert len(tables)==8
 blanks=[t for t in tables if len(t.findall(tag('tr')))==1 and not text(t).strip()]
 assert len(blanks)==4
 for t in blanks:
  h=t.find('.//'+tag('trHeight'));assert h.get(tag('hRule'))=='atLeast' and int(h.get(tag('val')))>=3000
 for n in range(1,5):assert f'Hình {n}.' in content
 assert content.count('Cần chụp:')==4
 assert 'không cần gửi thêm bài' in content
 for p in body.findall(tag('p')):
  if p.find('./'+tag('pPr')+'/'+tag('pStyle')) is not None:
   if p.find('./'+tag('pPr')+'/'+tag('pStyle')).get(tag('val'))=='Heading1':
    assert p.find('.//'+tag('rPr')+'/'+tag('color')).get(tag('val'))=='000000'
 with ZipFile(ROOT/'docs/reports/BaoCaoTuan2_TLCN_sat_du_an.docx') as source:
  for name in source.namelist():
   if name!='word/document.xml':assert source.read(name)==z.read(name),name
plan=json.loads((ROOT/'docs/reports/ke_hoach_tuan4_12.json').read_text(encoding='utf-8'))
assert plan['updated']=='2026-11-03' and plan['report_cutoff']=='2026-10-28'
weeks=plan['weeks'];assert [w['week'] for w in weeks]==list(range(4,13))
for i,w in enumerate(weeks):
 start=date.fromisoformat(w['start']);end=date.fromisoformat(w['end'])
 assert end-start==timedelta(days=6)
 if i:assert start-date.fromisoformat(weeks[i-1]['end'])==timedelta(days=1)
 assert w['work'] in content and w['accept'] in content
 if w['week']>=6:assert w['kind'] in ['planned','buffer']
assert weeks[-1]['end']=='2026-12-23'
assert [w['week'] for w in weeks if w['kind']=='buffer']==[11,12]
# Check the historical cutoff rather than treating today's schema as the week 4 implementation.
git=Path('C:/Users/Minh Nhat/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe')
def read_git(*args):
 return subprocess.check_output([str(git),'-c','safe.directory=C:/KhaoSatSinhVien',*args],cwd=ROOT,encoding='utf-8')
snapshot=read_git('show','0442800:prisma/schema.prisma')
assert set(re.search(r'enum Role\s*\{([^}]+)',snapshot).group(1).split())=={'ADMIN','STUDENT','LECTURER'}
assert 'DEAN' in re.search(r'enum Role\s*\{([^}]+)',(ROOT/'prisma/schema.prisma').read_text(encoding='utf-8')).group(1)
for commit in ['6cf9f85','386ba32','69bc3dc','0442800']:
 assert date.fromisoformat(read_git('show','-s','--format=%cs',commit).strip())<=date(2026,10,28)
assert read_git('show','-s','--format=%cs','ae7e9f3').strip()=='2026-10-19'
assert read_git('show','-s','--format=%cs','099ba89').strip()=='2026-10-29'
assert 'FACULTY' in read_git('show','0442800:src/modules/survey-campaign/audience.ts')
print('PASS: báo cáo tuần 4, 4 ô ảnh, lịch tuần 4–12, hai tuần dự phòng và mốc code lịch sử.')
