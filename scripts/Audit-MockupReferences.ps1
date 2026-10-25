param(
  [string]$TargetDirectory = 'C:\Screenshots\DAA-Algorithms\targetUI',
  [string]$OutputDirectory = 'artifacts/visual-qa/reference-audit'
)
# Internal comparison sheets only. These reference pixels must never become application assets.
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$targets = @(Get-ChildItem -LiteralPath $TargetDirectory -Filter '*.png' | Where-Object Name -Match '^\d{3}--' | Sort-Object Name)
$rows = @()
foreach ($target in $targets) {
  $referenceImage = [System.Drawing.Image]::FromFile($target.FullName)
  $rows += [pscustomobject]@{ number = [int]$target.Name.Substring(0,3); filename = $target.Name; width = $referenceImage.Width; height = $referenceImage.Height }
  $referenceImage.Dispose()
}
$rows | Export-Csv -NoTypeInformation -Path (Join-Path $OutputDirectory 'reference-inventory.csv')
$font = [System.Drawing.Font]::new('Arial', 11)
for ($start = 0; $start -lt $targets.Count; $start += 12) {
  $count = [Math]::Min(12, $targets.Count - $start)
  $sheet = [System.Drawing.Bitmap]::new(1500, [int]([Math]::Ceiling($count / 3.0) * 310))
  $graphics = [System.Drawing.Graphics]::FromImage($sheet)
  $graphics.Clear([System.Drawing.Color]::White)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  for ($index = 0; $index -lt $count; $index++) {
    $file = $targets[$start + $index]
    $referenceImage = [System.Drawing.Image]::FromFile($file.FullName)
    $x = ($index % 3) * 500
    $y = [int][Math]::Floor($index / 3.0) * 310
    $graphics.DrawString($file.Name.Substring(0, [Math]::Min(61, $file.Name.Length)), $font, [System.Drawing.Brushes]::Black, $x + 6, $y + 4)
    $scaledHeight = [int](488 * $referenceImage.Height / $referenceImage.Width)
    $graphics.DrawImage($referenceImage, $x + 6, $y + 25, 488, $scaledHeight)
    $referenceImage.Dispose()
  }
  $sheet.Save((Join-Path $OutputDirectory ('references-{0:000}-{1:000}.png' -f $rows[$start].number, $rows[$start + $count - 1].number)), [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $sheet.Dispose()
}
$font.Dispose()
$rows | Format-Table -AutoSize
Write-Output "Audited $($targets.Count) reference files. Contact sheets are internal evidence, not UI assets."
