param(
  [string]$TargetDirectory='C:\Screenshots\DAA-Algorithms\targetUI',
  [string]$ActualDirectory='artifacts/visual-qa/final',
  [string]$OutputRoot='artifacts/visual-qa'
)
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference='Stop'
$diffDirectory=Join-Path $OutputRoot 'diff-final';New-Item -ItemType Directory -Force -Path $diffDirectory|Out-Null
$rows=@()
foreach($number in 3..47){
  $prefix=$number.ToString('000')+'--'
  $target=Get-ChildItem -LiteralPath $TargetDirectory -Filter "$prefix*.png"|Select-Object -First 1
  $actual=Get-ChildItem -LiteralPath $ActualDirectory -Filter "$prefix*.png"|Select-Object -First 1
  if(-not $target -or -not $actual){continue}
  $a=[System.Drawing.Image]::FromFile($target.FullName);$b=[System.Drawing.Image]::FromFile($actual.FullName)
  $exact=$a.Width -eq $b.Width -and $a.Height -eq $b.Height
  [int]$w=[Math]::Floor($a.Width/4);[int]$h=[Math]::Floor($a.Height/4)
  $smallA=[System.Drawing.Bitmap]::new($w,$h);$smallB=[System.Drawing.Bitmap]::new($w,$h)
  $ga=[System.Drawing.Graphics]::FromImage($smallA);$gb=[System.Drawing.Graphics]::FromImage($smallB)
  $ga.DrawImage($a,0,0,$w,$h);$gb.DrawImage($b,0,0,$w,$h)
  $diff=[System.Drawing.Bitmap]::new($w,$h);[double]$total=0
  for($y=0;$y -lt $h;$y++){for($x=0;$x -lt $w;$x++){$ca=$smallA.GetPixel($x,$y);$cb=$smallB.GetPixel($x,$y);$dr=[Math]::Abs([int]$ca.R-[int]$cb.R);$dg=[Math]::Abs([int]$ca.G-[int]$cb.G);$db=[Math]::Abs([int]$ca.B-[int]$cb.B);$total+=$dr+$dg+$db;$diff.SetPixel($x,$y,[System.Drawing.Color]::FromArgb([Math]::Min(255,$dr*3),[Math]::Min(255,$dg*3),[Math]::Min(255,$db*3)))} }
  $similarity=[Math]::Round((1-$total/($w*$h*3*255))*100,2)
  $diff.Save((Join-Path $diffDirectory ($prefix+'diff.png')),[System.Drawing.Imaging.ImageFormat]::Png)
  $rows+=[pscustomobject]@{number=$number;target=$target.Name;actual=$actual.Name;similarity=$similarity;targetWidth=$a.Width;targetHeight=$a.Height;actualWidth=$b.Width;actualHeight=$b.Height;exactViewport=$exact}
  $ga.Dispose();$gb.Dispose();$smallA.Dispose();$smallB.Dispose();$diff.Dispose();$a.Dispose();$b.Dispose()
}
$metrics=Join-Path $OutputRoot 'metrics-final.csv';$rows|Export-Csv -NoTypeInformation -Path $metrics
$average=[Math]::Round(($rows|Measure-Object similarity -Average).Average,2);$exactCount=($rows|Where-Object exactViewport).Count
Write-Output "Compared $($rows.Count) pages; mean RGB similarity $average%; exact target viewport $exactCount/$($rows.Count)."
