#!/usr/bin/env python3
import json
import sys


def main():
    if len(sys.argv) < 3:
        raise SystemExit("Usage: transcribe.py <audio-path> <model>")

    audio_path = sys.argv[1]
    model_name = sys.argv[2]

    try:
        from faster_whisper import WhisperModel
    except Exception as exc:
        raise SystemExit(f"Missing faster-whisper dependency: {exc}")

    model = WhisperModel(model_name)
    segments, info = model.transcribe(audio_path, vad_filter=True)
    items = []
    full_text = []
    for segment in segments:
        text = (segment.text or "").strip()
        if not text:
            continue
        items.append({
            "start": float(segment.start),
            "end": float(segment.end),
            "text": text
        })
        full_text.append(text)

    print(json.dumps({
        "source": "asr",
        "language": getattr(info, "language", None),
        "text": " ".join(full_text).strip(),
        "segments": items
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
