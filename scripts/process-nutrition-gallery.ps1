Add-Type -AssemblyName System.Drawing

$sourceDir = "C:\Users\mateus.pereira\Downloads\fot-fit"
$outDir = "C:\Users\mateus.pereira\Downloads\fitness-360-saas\apps\web\public\gallery"
$targetW = 1200
$targetH = 420

$files = @(
  "images.jpg",
  "images (1).jpg",
  "images (2).jpg",
  "images (3).jpg",
  "images (4).jpg"
)

function New-HighQualityGraphics($bmp) {
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  return $g
}

function Get-RoundedRectPath($x, $y, $w, $h, $radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $radius * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

$index = 1
foreach ($file in $files) {
  $srcPath = Join-Path $sourceDir $file
  $src = [System.Drawing.Image]::FromFile($srcPath)
  $srcW = $src.Width
  $srcH = $src.Height

  $canvas = New-Object System.Drawing.Bitmap($targetW, $targetH)
  $g = New-HighQualityGraphics $canvas

  # --- Fundo desfocado (cover-fit em miniatura, depois ampliado) ---
  $blurW = 64
  $blurH = [int]($blurW * $targetH / $targetW)
  $small = New-Object System.Drawing.Bitmap($blurW, $blurH)
  $gs = New-HighQualityGraphics $small
  $scaleCover = [Math]::Max($blurW / $srcW, $blurH / $srcH)
  $dw = $srcW * $scaleCover
  $dh = $srcH * $scaleCover
  $dx = ($blurW - $dw) / 2
  $dy = ($blurH - $dh) / 2
  $gs.DrawImage($src, $dx, $dy, $dw, $dh)
  $gs.Dispose()
  $g.DrawImage($small, 0, 0, $targetW, $targetH)
  $small.Dispose()

  # --- Véu de cor da marca para unificar o clima escuro/roxo ---
  $overlay = [System.Drawing.Color]::FromArgb(130, 36, 15, 59)
  $overlayBrush = New-Object System.Drawing.SolidBrush($overlay)
  $g.FillRectangle($overlayBrush, 0, 0, $targetW, $targetH)
  $overlayBrush.Dispose()

  # --- Foto principal em destaque (contain, centralizada, cantos arredondados) ---
  $scaleContain = [Math]::Min($targetW / $srcW, $targetH / $srcH) * 0.86
  $fw = $srcW * $scaleContain
  $fh = $srcH * $scaleContain
  $fx = ($targetW - $fw) / 2
  $fy = ($targetH - $fh) / 2

  $shadowPath = Get-RoundedRectPath ($fx - 6) ($fy - 6) ($fw + 12) ($fh + 12) 18
  $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90, 0, 0, 0))
  $g.FillPath($shadowBrush, $shadowPath)
  $shadowBrush.Dispose()

  $clipPath = Get-RoundedRectPath $fx $fy $fw $fh 14
  $g.SetClip($clipPath)
  $g.DrawImage($src, $fx, $fy, $fw, $fh)
  $g.ResetClip()

  $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 255, 255, 255), 1.5)
  $g.DrawPath($borderPen, $clipPath)
  $borderPen.Dispose()

  $g.Dispose()
  $src.Dispose()

  $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $qualityParam = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]88)
  $encoderParams.Param[0] = $qualityParam
  $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }

  $outPath = Join-Path $outDir ("nutricao-{0}.jpg" -f $index)
  $canvas.Save($outPath, $jpegCodec, $encoderParams)
  $canvas.Dispose()
  Write-Output "Gerado: $outPath"
  $index++
}
