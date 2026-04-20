#!/usr/bin/env python3
"""
Download MS Global Building Footprints per-state GeoJSON from GitHub release.

Source: https://github.com/microsoft/USBuildingFootprints
Download URL pattern: https://usbuildingdata.blob.core.windows.net/usbuildings-v2/<State>.geojson.zip

FL file: ~500MB zipped, ~1.5GB uncompressed, ~6.2M polygons, vintage ~2018.

Usage:
  python3 scripts/phase_b/ms_download.py --state Florida --out .cache/ms_footprints
"""
import argparse, os, sys, zipfile
from pathlib import Path
from urllib.request import urlretrieve

BLOB_URL = "https://minedbuildings.z5.web.core.windows.net/legacy/usbuildings-v2/{state}.geojson.zip"


def download(state: str, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    url = BLOB_URL.format(state=state)
    zip_path = out_dir / f"{state}.geojson.zip"
    if zip_path.exists():
        print(f"[skip] {zip_path} already exists ({zip_path.stat().st_size/1e6:.1f}MB)")
    else:
        print(f"[dl ] {url}")
        def _progress(blocknum, bs, total):
            pct = blocknum * bs * 100 / total if total > 0 else 0
            sys.stdout.write(f"\r  {pct:5.1f}% ({blocknum * bs / 1e6:.0f}MB)")
            sys.stdout.flush()
        urlretrieve(url, zip_path, reporthook=_progress)
        print()

    geojson_path = out_dir / f"{state}.geojson"
    if geojson_path.exists():
        print(f"[skip] {geojson_path} already extracted ({geojson_path.stat().st_size/1e6:.1f}MB)")
    else:
        print(f"[unz] {zip_path} -> {out_dir}/")
        with zipfile.ZipFile(zip_path) as zf:
            zf.extractall(out_dir)
    return geojson_path


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--state", default="Florida")
    ap.add_argument("--out", default=".cache/ms_footprints")
    args = ap.parse_args()
    path = download(args.state, Path(args.out))
    print(f"\n[done] GeoJSON at: {path}")
