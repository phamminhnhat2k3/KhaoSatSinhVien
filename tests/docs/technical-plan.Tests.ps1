$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$documentPath = Join-Path $repositoryRoot 'docs\PHUONG_AN_KY_THUAT_MVP.md'

if (-not (Test-Path -LiteralPath $documentPath -PathType Leaf)) {
    throw "Không tìm thấy tài liệu phương án kỹ thuật: $documentPath"
}

$content = Get-Content -Raw -Encoding UTF8 -LiteralPath $documentPath
$requiredSections = @(
    '# Phương án kỹ thuật cho phiên bản MVP',
    '## 2. Phạm vi chức năng MVP',
    '## 3. Công nghệ sử dụng',
    '## 4. Kiến trúc tổng thể',
    '## 6. Vai trò và quyền hạn',
    '## 7. Mô hình dữ liệu dự kiến',
    '## 11. Bảo mật và quyền riêng tư',
    '## 12. Chiến lược kiểm thử',
    '## 15. Tiêu chí nghiệm thu MVP'
)

foreach ($section in $requiredSections) {
    if (-not $content.Contains($section)) {
        throw "Tài liệu thiếu mục bắt buộc: $section"
    }
}

$requiredTechnologies = @(
    'Next.js',
    'TypeScript',
    'MySQL',
    'Prisma',
    'Tailwind CSS',
    'Auth.js',
    'Vitest',
    'Playwright'
)

foreach ($technology in $requiredTechnologies) {
    if (-not $content.Contains($technology)) {
        throw "Tài liệu thiếu công nghệ đã thống nhất: $technology"
    }
}

if (($content | Select-String -Pattern '^# ' -AllMatches).Matches.Count -ne 1) {
    throw 'Tài liệu phải có đúng một tiêu đề cấp 1.'
}

if ($content -match '(?i)\b(TODO|TBD|FIXME)\b') {
    throw 'Tài liệu còn chứa nội dung giữ chỗ chưa hoàn thiện.'
}

Write-Host 'PASS: Tài liệu phương án kỹ thuật MVP đầy đủ các mục và công nghệ bắt buộc.'
