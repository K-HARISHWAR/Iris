$base = "d:\ml model"

$folders = @(
    "data\raw\normal",
    "data\raw\abnormal",
    "data\processed\colour\dark_brown",
    "data\processed\colour\brown",
    "data\processed\colour\light_brown",
    "data\processed\colour\hazel",
    "data\processed\abnormality\normal",
    "data\processed\abnormality\abnormal",
    "models",
    "src\preprocessing",
    "src\training",
    "src\inference",
    "src\utils",
    "notebooks"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path (Join-Path $base $folder) -Force | Out-Null
}

$files = @(
    "src\preprocessing\iris_crop.py",
    "src\preprocessing\normalize_colour.py",
    "src\preprocessing\resize.py",
    "src\training\train_colour.py",
    "src\training\train_abnormality.py",
    "src\training\augment.py",
    "src\inference\predict_colour.py",
    "src\inference\predict_abnormality.py",
    "src\inference\pipeline.py",
    "src\utils\config.py",
    "src\utils\metrics.py",
    "src\utils\logger.py",
    "requirements.txt",
    "README.md"
)

foreach ($file in $files) {
    New-Item -ItemType File -Path (Join-Path $base $file) -Force | Out-Null
}

Write-Host "Folder structure created successfully!"
