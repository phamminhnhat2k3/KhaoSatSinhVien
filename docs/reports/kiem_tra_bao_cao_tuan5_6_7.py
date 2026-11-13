"""Kiểm tra bản nộp báo cáo tuần 5 6 7 so với mẫu và lịch báo cáo."""
from pathlib import Path
from zipfile import ZipFile
from lxml import etree as E
import unittest
ROOT=Path(__file__).resolve().parents[2]
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships','a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
text=lambda e:' '.join(e.xpath('//w:t/text()',namespaces=NS))
class Reports567(unittest.TestCase):
    def test_submission_files(self):
        dates={5:'04/11/2026',6:'11/11/2026',7:'18/11/2026'}
        ref=ROOT/'docs/reports/BaoCaoTuan4_TLCN.docx'
        with ZipFile(ref) as z:
            original=E.fromstring(z.read('word/document.xml'))
            section=E.tostring(original.find('.//w:sectPr',NS))
            retained={n:z.read(n) for n in z.namelist() if n.startswith(('word/styles','word/header','word/footer','word/theme','word/fontTable'))}
        for week in (5,6,7):
            with self.subTest(week=week),ZipFile(ROOT/f'docs/reports/BaoCaoTuan{week}_TLCN_ban_nop.docx') as z:
                self.assertIsNone(z.testzip())
                root=E.fromstring(z.read('word/document.xml'));body=text(root)
                self.assertIn(f'BÁO CÁO CÔNG VIỆC TUẦN {week}',body)
                for value in ('Nguyễn Văn Sang','Phạm Minh Nhật','Ths. Đoàn Thanh Phong',dates[week]):self.assertIn(value,body)
                self.assertGreater(len(body.split()),1500)
                for value in (';','Bạn chèn','bạn có thể chụp','mình sẽ','/accounts','/messi'):self.assertNotIn(value,body)
                captions=root.xpath('//w:p[starts-with(w:r/w:t,"Hình ")]',namespaces=NS)
                self.assertEqual(len(captions),6)
                drawings=root.xpath('//a:blip/@r:embed',namespaces=NS)
                self.assertEqual(len(drawings),6)
                rels=E.fromstring(z.read('word/_rels/document.xml.rels'))
                mapping={r.get('Id'):r.get('Target') for r in rels}
                for rid in drawings:
                    self.assertIn('word/'+mapping[rid],z.namelist())
                self.assertEqual(section,E.tostring(root.find('.//w:sectPr',NS)))
                for name,data in retained.items():self.assertEqual(z.read(name),data)
                if week==5:
                    for role in ('Quản trị viên','Sinh viên','Giảng viên','Trưởng khoa'):self.assertIn(role,body)
                    self.assertIn('Không duyệt hoặc công bố đợt',body)
                    self.assertIn('không hiển thị bài trả lời gắn với danh tính',body)
                elif week==6:
                    for rule in ('15 lớp và 75 sinh viên','2 học kỳ','Danh sách riêng thay cho phân công chung','không làm thay đổi đối tượng trong phiếu cũ'):self.assertIn(rule,body)
                else:
                    for rule in ('Một sinh viên chỉ gửi một lần','không được tính là bài đã gửi','múi giờ Việt Nam','khoảng trắng'):self.assertIn(rule,body)
if __name__=='__main__':unittest.main(verbosity=2)
