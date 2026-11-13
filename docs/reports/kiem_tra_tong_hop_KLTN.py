from pathlib import Path
from zipfile import ZipFile
from lxml import etree as E
import unittest
ROOT=Path(__file__).resolve().parents[2]
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
class FunctionSummary(unittest.TestCase):
 def test_format_and_current_status(self):
  ref=ROOT/'docs/reports/BaoCaoTuan5_TLCN_ban_nop.docx'
  with ZipFile(ref) as source,ZipFile(ROOT/'docs/reports/Tong_hop_chuc_nang_va_huong_phat_trien_KLTN.docx') as z:
   self.assertIsNone(z.testzip())
   root=E.fromstring(z.read('word/document.xml'))
   text=' '.join(root.xpath('//w:t/text()',namespaces=NS))
   for value in ('Nguyễn Văn Sang','Phạm Minh Nhật','Ths. Đoàn Thanh Phong','13/11/2026','2. Các chức năng đã làm','3. Những phần chưa hoàn thành','4. Hướng phát triển trong khóa luận tốt nghiệp','2.6. Thông báo và hướng dẫn'):self.assertIn(value,text)
   for value in (';','vitrung65','/accounts','/messi','Bạn chèn','mình sẽ'):self.assertNotIn(value,text)
   done=text.split('2. Các chức năng đã làm')[1].split('3. Những phần chưa hoàn thành')[0]
   for value in ('Gmail','PDF','Excel XLSX','nhắc tự động','đối chiếu','sửa và xóa','phiên đăng nhập cũ'):self.assertIn(value,done)
   missing=text.split('3. Những phần chưa hoàn thành')[1].split('4. Hướng phát triển')[0]
   for value in ('nhật ký','sao lưu tự động','tài khoản trường','rẽ nhánh','tải lớn'):self.assertIn(value,missing)
   self.assertIn('hướng dự kiến, chưa tính là chức năng đã hoàn thành',text)
   self.assertGreater(len(text.split()),1600)
   original=E.fromstring(source.read('word/document.xml'))
   self.assertEqual(E.tostring(root.find('.//w:sectPr',NS)),E.tostring(original.find('.//w:sectPr',NS)))
   for name in source.namelist():
    if name!='word/document.xml':self.assertEqual(z.read(name),source.read(name))
   self.assertFalse(root.xpath('//w:drawing',namespaces=NS))
 def test_implementation_evidence(self):
  for path in ('src/app/admin/academic/manage.ts','src/app/forgot-password/page.tsx','src/app/reset-password/page.tsx','src/app/results/page.tsx','src/app/admin/import/page.tsx','src/app/api/reports/campaigns/[id]/export/route.ts','src/app/help/page.tsx'):
   self.assertTrue((ROOT/path).is_file(),path)
if __name__=='__main__':unittest.main(verbosity=2)

