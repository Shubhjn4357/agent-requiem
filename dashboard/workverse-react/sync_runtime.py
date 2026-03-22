from __future__ import annotations

import argparse
import json
import shutil
import time
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parent
REPO_ROOT = APP_ROOT.parent.parent
SOURCE_DIR = REPO_ROOT / "memory"
PUBLIC_RUNTIME_DIR = APP_ROOT / "public" / "runtime"
DIST_RUNTIME_DIR = APP_ROOT / "dist" / "runtime"
STATE_DIR = APP_ROOT / ".runtime"
FILES = [
    "memory-store.json",
    "session.json",
    "usage-tracker.json",
    "model_costs.json",
]


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def write_status(target_dir: Path, synced_files: list[str]) -> None:
    ensure_dir(target_dir)
    payload = {
        "synced_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "source": str(SOURCE_DIR),
        "files": synced_files,
    }
    (target_dir / "status.json").write_text(
        json.dumps(payload, indent=2),
        encoding="utf-8",
    )


def sync_target(target_dir: Path) -> list[str]:
    ensure_dir(target_dir)
    copied = []
    for file_name in FILES:
        source_path = SOURCE_DIR / file_name
        if source_path.exists():
            shutil.copy2(source_path, target_dir / file_name)
            copied.append(file_name)
    write_status(target_dir, copied)
    return copied


def sync_once() -> None:
    if not SOURCE_DIR.exists():
        raise FileNotFoundError(f"Memory source not found: {SOURCE_DIR}")

    copied = sync_target(PUBLIC_RUNTIME_DIR)
    if DIST_RUNTIME_DIR.parent.exists():
        sync_target(DIST_RUNTIME_DIR)

    ensure_dir(STATE_DIR)
    (STATE_DIR / "last_sync.json").write_text(
        json.dumps(
            {
                "synced_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                "copied": copied,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Synced runtime files: {', '.join(copied) if copied else 'none'}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync agent memory into the isolated Workverse runtime folder.")
    parser.add_argument("--watch", action="store_true", help="Keep syncing in a background loop.")
    parser.add_argument("--interval", type=float, default=2.0, help="Polling interval in seconds while watching.")
    parser.add_argument("--once", action="store_true", help="Sync one time and exit.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    sync_once()

    if args.once or not args.watch:
        return

    while True:
        time.sleep(max(0.5, args.interval))
        try:
            sync_once()
        except Exception as exc:  # pragma: no cover - background watchdog path
            ensure_dir(STATE_DIR)
            (STATE_DIR / "last_error.txt").write_text(str(exc), encoding="utf-8")
            print(f"sync failed: {exc}")


if __name__ == "__main__":
    main()
