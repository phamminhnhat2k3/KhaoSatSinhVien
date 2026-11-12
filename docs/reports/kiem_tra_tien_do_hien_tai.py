from pathlib import Path
from zipfile import ZipFile
import unittest
import xml.etree.ElementTree as ET

REPORT=Path(__file__).with_name('Tien_do_du_an_khao_sat_sinh_vien_12_11_2026.docx')
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
class ProgressReportChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with ZipFile(REPORT) as archive:
            cls.root=ET.fromstring(archive.read('word/document.xml'))
            cls.styles=ET.fromstring(archive.read('word/styles.xml'))
        cls.text='\n'.join(''.join(p.itertext()) for p in cls.root.findall('.//w:t',NS))
    def test_sections_and_current_status(self):
        for title in ['1 Tiến độ hiện tại','2 Các tính năng đã làm','3 Công việc đang thực hiện','4 Các chức năng dự kiến làm','5 Kết quả kiểm tra gần nhất']:
            self.assertIn(title,self.text)
        for phrase in ['12/11/2026','181 bài kiểm thử','29 kịch bản','chạy trên máy cá nhân','Chưa kiểm thử tải lớn']:
            self.assertIn(phrase,self.text)
    def test_no_credentials_or_private_features(self):
        for phrase in ['vitrung65','/accounts','/messi','mình sẽ','bạn hãy',';']:
            self.assertNotIn(phrase,self.text.lower())
        self.assertNotIn('passwordHash',self.text)
    def test_simple_layout(self):
        self.assertEqual(len(self.root.findall('.//w:tbl',NS)),0)
        bullets=[p for p in self.root.findall('.//w:p',NS) if p.find('w:pPr/w:pStyle',NS) is not None and p.find('w:pPr/w:pStyle',NS).get('{'+NS['w']+'}val')=='ListBullet']
        self.assertEqual(len(bullets),21)
        title=self.styles.find("w:style[@w:styleId='Title']",NS)
        self.assertIsNone(title.find('.//w:pBdr',NS))
if __name__=='__main__':unittest.main()
