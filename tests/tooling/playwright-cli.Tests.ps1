$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$skillPath = Join-Path $repositoryRoot '.agents\skills\playwright-cli\SKILL.md'
$gitignorePath = Join-Path $repositoryRoot '.gitignore'

$command = Get-Command 'playwright-cli' -ErrorAction Stop
if (-not $command.Source) {
    throw 'Không xác định được vị trí lệnh playwright-cli.'
}

$version = (& playwright-cli --version).Trim()
if ($LASTEXITCODE -ne 0 -or $version -notmatch '^\d+\.\d+\.\d+') {
    throw "Playwright CLI không trả về phiên bản hợp lệ: $version"
}

if (-not (Test-Path -LiteralPath $skillPath -PathType Leaf)) {
    throw "Không tìm thấy Playwright skill dành cho agent: $skillPath"
}

$skillContent = Get-Content -Raw -Encoding UTF8 -LiteralPath $skillPath
if ($skillContent -notmatch '(?m)^name:\s*playwright-cli\s*$') {
    throw 'Playwright skill không khai báo đúng tên.'
}

$gitignoreContent = Get-Content -Raw -Encoding UTF8 -LiteralPath $gitignorePath
if ($gitignoreContent -notmatch '(?m)^\.playwright-cli/$') {
    throw '.gitignore chưa loại trừ dữ liệu phiên Playwright CLI.'
}

Write-Host "PASS: Playwright CLI $version và agent skill đã được cấu hình đúng."
