import os

from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

MODEL = "gpt-5.4-mini"

SYSTEM_PROMPT = """You are an F1 driving coach. You'll be given a compact JSON summary
comparing a driver's lap to their own fastest lap of the session — sector time
deltas, braking-zone distance deltas, and per-corner apex speed / throttle
reapplication deltas. Write 2-4 short paragraphs of specific, actionable
coaching feedback, referencing actual corners and numbers from the data. Do
not invent details not present in the summary."""


def generate_narrative(feature_summary: dict) -> str:
    response = client.responses.create(
        model=MODEL,
        max_output_tokens=500,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": str(feature_summary)}
        ]
    )
    return response.output_text
