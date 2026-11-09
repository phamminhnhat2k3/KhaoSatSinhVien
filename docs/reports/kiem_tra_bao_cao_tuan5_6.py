"""Kiểm tra cấu trúc và nội dung chính của báo cáo tuần 5, 6."""
from datetime import date
from pathlib import Path
from zipfile import ZipFile
import json
import unittest
from lxml import etree

ROOT = Path(__file__).resolve().parents[2]
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W}
tag = lambda name: f"{{{W}}}{name}"
text = lambda element: "".join(element.xpath(".//w:t/text()", namespaces=NS))


class WeeklyReports(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.reports = {}
        for week in (5, 6):
            with ZipFile(ROOT / f"docs/reports/BaoCaoTuan{week}_TLCN.docx") as package:
                assert package.testzip() is None
                cls.reports[week] = etree.fromstring(package.read("word/document.xml"))

    def test_identity_and_allocated_dates(self):
        plan = json.loads((ROOT / "docs/reports/ke_hoach_tuan4_12.json").read_text(encoding="utf-8"))
        for week, root in self.reports.items():
            with self.subTest(week=week):
                content = text(root)
                self.assertIn(f"BÁO CÁO CÔNG VIỆC TUẦN {week}", content)
                for name in ("Nguyễn Văn Sang", "Phạm Minh Nhật", "Ths. Đoàn Thanh Phong"):
                    self.assertIn(name, content)
                end = next(item["end"] for item in plan["weeks"] if item["week"] == week)
                self.assertIn(date.fromisoformat(end).strftime("%d/%m/%Y"), content)

    def test_six_expandable_image_spaces_each(self):
        for week, root in self.reports.items():
            with self.subTest(week=week):
                blanks = [t for t in root.xpath("./w:body/w:tbl", namespaces=NS) if not text(t).strip()]
                self.assertEqual(len(blanks), 6)
                self.assertEqual(len(root.xpath("//w:drawing", namespaces=NS)), 0)
                for table in blanks:
                    height = table.find(".//" + tag("trHeight"))
                    self.assertEqual(height.get(tag("hRule")), "atLeast")
                    self.assertGreaterEqual(int(height.get(tag("val"))), 3000)
                captions = [text(p) for p in root.xpath("./w:body/w:p", namespaces=NS) if text(p).startswith("Hình ")]
                self.assertEqual(len(captions), 6)
                for index, caption in enumerate(captions, 1):
                    self.assertTrue(caption.startswith(f"Hình {index}. "))

    def test_submission_prose_and_sufficient_detail(self):
        for week, root in self.reports.items():
            with self.subTest(week=week):
                content = text(root)
                self.assertGreater(len(content.split()), 1000)
                self.assertNotIn(";", content)
                for instruction in ("Cần chụp:", "Bạn chèn", "bạn có thể", "mình sẽ", "ngày code thực tế", "170 test"):
                    self.assertNotIn(instruction, content)
                self.assertGreaterEqual(len([p for p in root.xpath("./w:body/w:p", namespaces=NS) if text(p).startswith("- ")]), 15)

    def test_source_page_geometry_and_black_body(self):
        for root in self.reports.values():
            sections = root.xpath("//w:sectPr", namespaces=NS)
            self.assertEqual(len(sections), 1)
            size, margin = sections[0].find(tag("pgSz")), sections[0].find(tag("pgMar"))
            self.assertEqual((size.get(tag("w")), size.get(tag("h"))), ("12240", "15840"))
            self.assertEqual((margin.get(tag("left")), margin.get(tag("right"))), ("1417", "1134"))
            for color in root.xpath("./w:body/w:p/w:r/w:rPr/w:color", namespaces=NS):
                self.assertIn(color.get(tag("val")).upper(), ("000000", "AUTO"))

    def test_week5_scope_and_week6_assignment_rules(self):
        five, six = text(self.reports[5]), text(self.reports[6])
        for role in ("Quản trị viên", "Sinh viên", "Giảng viên", "Trưởng khoa"):
            self.assertIn(role, five)
        self.assertIn("Không duyệt hoặc công bố đợt", five)
        self.assertIn("mỗi môn của một lớp chỉ phân công một giảng viên", five)
        self.assertIn("không hiển thị bài trả lời gắn với danh tính", five)
        for value in ("5 khoa", "15 lớp và 75 sinh viên", "20 giảng viên", "5 người có quyền Trưởng khoa", "2 học kỳ", "học 4 môn"):
            self.assertIn(value, six)
        self.assertIn("Danh sách riêng thay cho phân công chung", six)
        self.assertIn("không làm thay đổi đối tượng trong phiếu cũ", six)
        self.assertIn("Tuần 11, 12", six)
        schema = (ROOT / "prisma/schema.prisma").read_text(encoding="utf-8")
        for model in ("ClassStudyAssignment", "StudentStudyPlan", "ParticipationTeaching"):
            self.assertIn(f"model {model}", schema)


if __name__ == "__main__":
    unittest.main(verbosity=2)
