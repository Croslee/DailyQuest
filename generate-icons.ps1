Add-Type -AssemblyName System.Drawing

function Render-SwordsIcon {
    param(
        [int]$size,
        [float]$cornerRadiusPercent = 0.22,
        [string]$outPath
    )

    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # 1. Background: Exact #090d16 (R=9, G=13, B=22)
    $bgColor = [System.Drawing.Color]::FromArgb(255, 9, 13, 22)
    $bgBrush = New-Object System.Drawing.SolidBrush($bgColor)

    # Corner radius based on standard squircle conventions
    $radius = if ($size -ge 128) { 26.0 } elseif ($size -ge 48) { 10.0 } else { 2.5 }
    if ($radius -gt 0) {
        $bgPath = New-Object System.Drawing.Drawing2D.GraphicsPath
        $bgPath.AddArc(0, 0, $radius, $radius, 180, 90)
        $bgPath.AddArc($size - $radius, 0, $radius, $radius, 270, 90)
        $bgPath.AddArc($size - $radius, $size - $radius, $radius, $radius, 0, 90)
        $bgPath.AddArc(0, $size - $radius, $radius, $radius, 90, 90)
        $bgPath.CloseFigure()
        $g.FillPath($bgBrush, $bgPath)
        $bgPath.Dispose()
    } else {
        $g.FillRectangle($bgBrush, 0, 0, $size, $size)
    }
    $bgBrush.Dispose()

    # 2. Draw Swords Emblem: Exact #64748b (R=100, G=116, B=139)
    # Lucide Swords coordinates on 24x24 viewBox:
    # Sword content is from x=3..21, y=3..21 (width=18, height=18, center at 12, 12)
    # We map 24x24 viewBox onto the icon with balanced padding so it occupies ~68% of the canvas.
    $targetSize = [float]($size * 0.68)
    $offset = [float](($size - $targetSize) / 2.0)
    $scale = [float]($targetSize / 18.0) # 18 units from (3,3) to (21,21)

    # Transform function from Lucide 24x24 coords (range 3..21) to canvas coords
    function MapX([float]$lx) { return $offset + (($lx - 3.0) * $scale) }
    function MapY([float]$ly) { return $offset + (($ly - 3.0) * $scale) }

    $strokeW = [float](([math]::Max(1.4, 2.0 * ($targetSize / 24.0))))
    if ($size -eq 16) { $strokeW = 1.5 }

    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 100, 116, 139), $strokeW)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    # Polyline 1: "14.5 17.5 3 6 3 3 6 3 17.5 14.5"
    [System.Drawing.PointF[]]$poly1 = @(
        (New-Object System.Drawing.PointF((MapX 14.5), (MapY 17.5))),
        (New-Object System.Drawing.PointF((MapX 3.0), (MapY 6.0))),
        (New-Object System.Drawing.PointF((MapX 3.0), (MapY 3.0))),
        (New-Object System.Drawing.PointF((MapX 6.0), (MapY 3.0))),
        (New-Object System.Drawing.PointF((MapX 17.5), (MapY 14.5)))
    )
    $g.DrawLines($pen, $poly1)

    # Line 1: "13 19 -> 19 13" (Crossguard 1)
    $g.DrawLine($pen, (MapX 13.0), (MapY 19.0), (MapX 19.0), (MapY 13.0))

    # Line 2: "16 16 -> 20 20" (Handle 1)
    $g.DrawLine($pen, (MapX 16.0), (MapY 16.0), (MapX 20.0), (MapY 20.0))

    # Line 3: "19 21 -> 21 19" (Pommel 1)
    $g.DrawLine($pen, (MapX 19.0), (MapY 21.0), (MapX 21.0), (MapY 19.0))

    # Polyline 2: "14.5 6.5 18 3 21 3 21 6 17.5 9.5"
    [System.Drawing.PointF[]]$poly2 = @(
        (New-Object System.Drawing.PointF((MapX 14.5), (MapY 6.5))),
        (New-Object System.Drawing.PointF((MapX 18.0), (MapY 3.0))),
        (New-Object System.Drawing.PointF((MapX 21.0), (MapY 3.0))),
        (New-Object System.Drawing.PointF((MapX 21.0), (MapY 6.0))),
        (New-Object System.Drawing.PointF((MapX 17.5), (MapY 9.5)))
    )
    $g.DrawLines($pen, $poly2)

    # Line 4: "5 14 -> 9 18" (Crossguard 2)
    $g.DrawLine($pen, (MapX 5.0), (MapY 14.0), (MapX 9.0), (MapY 18.0))

    # Line 5: "7 17 -> 4 20" (Handle 2)
    $g.DrawLine($pen, (MapX 7.0), (MapY 17.0), (MapX 4.0), (MapY 20.0))

    # Line 6: "3 19 -> 5 21" (Pommel 2)
    $g.DrawLine($pen, (MapX 3.0), (MapY 19.0), (MapX 5.0), (MapY 21.0))

    $pen.Dispose()
    $g.Dispose()

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Saved: $outPath ($size x $size)"
}

$outDir = "C:\Users\nateQ\.gemini\antigravity\scratch\dailyquest\public\icons"
Render-SwordsIcon -size 128 -outPath (Join-Path $outDir "icon128.png")
Render-SwordsIcon -size 48 -outPath (Join-Path $outDir "icon48.png")
Render-SwordsIcon -size 16 -outPath (Join-Path $outDir "icon16.png")



