"""Run with the bundled Python runtime; validates the delivered report package."""
from pathlib import Path
from zipfile import ZipFile
import unittest
import xml.etree.ElementTree as E

REPORT = Path(__file__).resolve().parents[2] / 'docs/bao-cao/Bao_cao_tuan_3.docx'
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W = '{' + NS['w'] + '}'


class WeekThreeReportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with ZipFile(REPORT) as package:
            assert package.testzip() is None
            cls.doc = E.fromstring(package.read('word/document.xml'))
        cls.text = '\n'.join(t.text or '' for t in cls.doc.findall('.//w:t', NS))

    def test_identity_and_schedule(self):
        for value in ['BÁO CÁO CÔNG VIỆC TUẦN 3', 'Nguyễn Văn Sang',
                      'Phạm Minh Nhật', 'Ths. Đoàn Thanh Phong', '21/10/2026']:
            self.assertIn(value, self.text)
        self.assertNotIn('14/10/2026', self.text)
        self.assertIn('Tuần 4 và tuần 5 sẽ bắt đầu triển khai mã nguồn', self.text)
        self.assertIn('chưa phải kết quả chạy kiểm thử phần mềm', self.text)

    def test_template_geometry_and_sections(self):
        section = self.doc.findall('.//w:sectPr', NS)
        self.assertEqual(len(section), 1)
        size = section[0].find('w:pgSz', NS)
        self.assertEqual((size.get(W+'w'), size.get(W+'h')), ('12240', '15840'))
        margins = section[0].find('w:pgMar', NS)
        self.assertEqual(margins.get(W+'left'), '1417')
        self.assertEqual(margins.get(W+'right'), '1134')
        self.assertEqual(len(self.doc.findall('.//w:body/w:p/w:pPr/w:pageBreakBefore', NS)), 5)
        self.assertEqual(len(self.doc.findall('.//w:body/w:tbl', NS)), 6)

    def test_design_content_and_test_plan(self):
        for value in ['MySQL', 'Prisma', 'lớp hành chính', 'lớp học phần',
                      'ẩn danh', 'A, B, C', 'A, D, E', 'toàn trường']:
            self.assertIn(value, self.text)
        for number in range(1, 10):
            self.assertIn(f'KT-{number:02}', self.text)
        headings = [p for p in self.doc.findall('.//w:body/w:p', NS)
                    if p.find('w:pPr/w:pStyle', NS) is not None]
        self.assertEqual(len(headings), 8)


if __name__ == '__main__':
    unittest.main()
