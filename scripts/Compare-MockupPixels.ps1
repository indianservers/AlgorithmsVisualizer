param(
  [string]$TargetDirectory = 'C:\Screenshots\DAA-Algorithms\targetUI',
  [string]$ActualDirectory = 'artifacts/visual-qa/current-inventory',
  [string]$OutputDirectory = 'artifacts/visual-qa/pixel-audit',
  [int[]]$RenderNumbers = @(17)
)
# Strict RGB comparison is evidence of difference, not a perceptual/fidelity score.
# Reference pixels in generated overlays are diagnostic only and never app assets.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$drawingReferences = @('System.Drawing.Common', 'System.Drawing.Primitives')
foreach ($assemblyName in @('System.Private.Windows.GdiPlus', 'System.Private.Windows.Core')) {
  if (Test-Path -LiteralPath (Join-Path $PSHOME ($assemblyName + '.dll'))) { $drawingReferences += $assemblyName }
}
Add-Type -ReferencedAssemblies $drawingReferences -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class MockupPixelAudit {
  public static double[] Compare(string expected, string actual, string overlayPath, string diffPath) {
    using(var source = new Bitmap(expected)) using(var delivered = new Bitmap(actual)) {
      if(source.Width != delivered.Width || source.Height != delivered.Height) return new double[]{0,0,0,0,0};
      int w=source.Width,h=source.Height;
      using(var a=new Bitmap(w,h,PixelFormat.Format32bppArgb)) using(var b=new Bitmap(w,h,PixelFormat.Format32bppArgb)) {
        using(var g=Graphics.FromImage(a)) g.DrawImageUnscaled(source,0,0);
        using(var g=Graphics.FromImage(b)) g.DrawImageUnscaled(delivered,0,0);
        var rect=new Rectangle(0,0,w,h);
        var ad=a.LockBits(rect,ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
        var bd=b.LockBits(rect,ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
        byte[] av=new byte[ad.Stride*h],bv=new byte[bd.Stride*h];
        Marshal.Copy(ad.Scan0,av,0,av.Length);Marshal.Copy(bd.Scan0,bv,0,bv.Length);
        a.UnlockBits(ad);b.UnlockBits(bd);
        long different=0,absolute=0;int maxDelta=0;
        byte[] overlay=String.IsNullOrEmpty(overlayPath)?null:new byte[av.Length],diff=String.IsNullOrEmpty(diffPath)?null:new byte[av.Length];
        for(int y=0;y<h;y++)for(int x=0;x<w;x++) {
          int offset=y*ad.Stride+x*4;bool changed=false;
          for(int channel=0;channel<3;channel++) {
            int delta=Math.Abs(av[offset+channel]-bv[offset+channel]);
            absolute+=delta;if(delta>maxDelta)maxDelta=delta;if(delta!=0)changed=true;
            if(overlay!=null)overlay[offset+channel]=(byte)((av[offset+channel]+bv[offset+channel])/2);
            if(diff!=null)diff[offset+channel]=(byte)Math.Min(255,delta*4);
          }
          if(changed)different++;
          if(overlay!=null)overlay[offset+3]=255;if(diff!=null)diff[offset+3]=255;
        }
        if(overlay!=null)Save(overlay,w,h,overlayPath);
        if(diff!=null)Save(diff,w,h,diffPath);
        return new double[]{1,(long)w*h,different,(double)absolute/((long)w*h*3),maxDelta};
      }
    }
  }
  private static void Save(byte[] bytes,int width,int height,string path) {
    using(var bitmap=new Bitmap(width,height,PixelFormat.Format32bppArgb)) {
      var data=bitmap.LockBits(new Rectangle(0,0,width,height),ImageLockMode.WriteOnly,PixelFormat.Format32bppArgb);
      Marshal.Copy(bytes,0,data.Scan0,bytes.Length);bitmap.UnlockBits(data);bitmap.Save(path,ImageFormat.Png);
    }
  }
}
'@
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$rows = @()
foreach ($number in 3..47) {
  $prefix = '{0:000}--' -f $number
  $target = Get-ChildItem -LiteralPath $TargetDirectory -Filter "$prefix*.png" | Select-Object -First 1
  $actual = Get-ChildItem -LiteralPath $ActualDirectory -Filter "$prefix*.png" | Select-Object -First 1
  if (-not $target -or -not $actual) {
    $rows += [pscustomobject]@{ number=$number; reference=$target.Name; actual=$actual.Name; dimensionsMatch=$false; totalPixels=0; differentPixels=$null; differentPixelPercent=$null; meanAbsoluteRgbError=$null; exactMatch=$false; status='missing evidence' }
    continue
  }
  $overlay = $null; $diff = $null
  if ($RenderNumbers -contains $number) {
    $overlay = [IO.Path]::GetFullPath((Join-Path $OutputDirectory ($prefix + 'overlay.png')))
    $diff = [IO.Path]::GetFullPath((Join-Path $OutputDirectory ($prefix + 'difference.png')))
  }
  $result = [MockupPixelAudit]::Compare($target.FullName, $actual.FullName, $overlay, $diff)
  $rows += [pscustomobject]@{ number=$number; reference=$target.Name; actual=$actual.Name; dimensionsMatch=($result[0] -eq 1); totalPixels=$result[1]; differentPixels=$result[2]; differentPixelPercent=$(if($result[1]){[Math]::Round(100*$result[2]/$result[1],4)}else{$null}); meanAbsoluteRgbError=[Math]::Round($result[3],4); exactMatch=($result[0] -eq 1 -and $result[2] -eq 0); status=$(if($result[0] -eq 0){'viewport mismatch'}elseif($result[2] -eq 0){'pixel identical; interaction verification still required'}else{'visual differences remain'}) }
}
$rows | Export-Csv -NoTypeInformation -Path (Join-Path $OutputDirectory 'strict-pixel-comparison.csv')
$rows | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $OutputDirectory 'strict-pixel-comparison.json')
Write-Output "Compared $($rows.Count) targets. Exact-size captures: $(@($rows | Where-Object dimensionsMatch).Count). Pixel-identical pages: $(@($rows | Where-Object exactMatch).Count)."
Write-Output 'Loading/rendering/functional passes do not prove visual matching. Nonzero differences require inspection; white-background similarity is not completion evidence.'
