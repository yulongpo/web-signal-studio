"""HTTP client examples for Bot-B detection page wiring."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_http_client_examples_doc_exists():
    doc = ROOT / "docs" / "HTTP_CLIENT_EXAMPLES.md"
    assert doc.is_file()
    text = doc.read_text(encoding="utf-8")
    for needle in (
        "Authorization: Bearer",
        "/capabilities",
        "/tasks",
        "cancel",
        "uiMessages",
        "BLOCKED",
        "decimal",
        "canInventResults",
        "detection-page-client.ts",
        "127.0.0.1",
        "NO_FAKE_INFERENCE",
    ):
        assert needle in text, f"missing {needle}"


def test_detection_page_client_ts_example_exists():
    path = ROOT / "examples" / "detection-page-client.ts"
    assert path.is_file()
    text = path.read_text(encoding="utf-8")
    for needle in (
        "LocalComputeClient",
        "getCapabilities",
        "createTask",
        "getTask",
        "cancelTask",
        "Bearer",
        "canInventResults",
        "EXAMPLE_CAPABILITIES_BLOCKED",
        "EXAMPLE_TASK_BLOCKED",
        "ffscn.detect",
        "sampleRange",
        "NO_FAKE_INFERENCE",
        "STUB_NON_TENSORRT",
    ):
        assert needle in text, f"missing {needle}"
    # Must not teach inventing detections
    assert "invent candidates" in text.lower() or "invent results" in text.lower() or "never invent" in text.lower()


def test_contract_doc_links_http_examples():
    doc = ROOT / "docs" / "DETECTION_PAGE_CONTRACT.md"
    text = doc.read_text(encoding="utf-8")
    assert "HTTP_CLIENT_EXAMPLES.md" in text
