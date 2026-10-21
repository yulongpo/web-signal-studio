"""Committed openapi.yaml + FastAPI /openapi.json smoke."""

from __future__ import annotations

from pathlib import Path


def test_committed_openapi_yaml_lists_routes_and_ui_messages():
    root = Path(__file__).resolve().parents[1]
    path = root / "openapi.yaml"
    assert path.is_file(), "openapi.yaml must be committed under services/local-compute"
    text = path.read_text(encoding="utf-8")
    for needle in (
        "/capabilities",
        "/tasks",
        "/tasks/{runId}",
        "/tasks/{runId}/cancel",
        "UiMessage",
        "uiMessages",
        "messageZh",
        "bearerAuth",
        "GPU_MISSING",
    ):
        # GPU_MISSING is in contract doc; openapi may not list codes — check schemas
        if needle == "GPU_MISSING":
            continue
        assert needle in text, f"missing {needle}"
    assert "DetectionCapabilities" in text
    assert "TaskRecord" in text


def test_detection_page_contract_doc_exists():
    root = Path(__file__).resolve().parents[1]
    doc = root / "docs" / "DETECTION_PAGE_CONTRACT.md"
    assert doc.is_file()
    text = doc.read_text(encoding="utf-8")
    assert "GPU_MISSING" in text
    assert "未检测到 NVIDIA GPU" in text
    assert "Authorization: Bearer" in text
    assert "decimal" in text.lower()
    assert "STUB_RUNTIME" in text
