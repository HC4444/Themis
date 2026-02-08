# Goal: Given a legal transcript textblock, identify the possible issues.

import os
import json
from google import genai
from google.genai import types

# AVOID HARDCODING IN PRODUCTION
gem_key = "AIzaSyAdMIvGNU2nurZGuEuidqeoWYf0HC1Hp64"

client = genai.Client(api_key=gem_key)

system_instruction = """
You are an expert Trauma-Informed Legal Redactor. Your goal is to protect survivor anonymity.
Analyze text for 'Identity Clusters' including:
1. Direct PII (Names, SSNs, exact addresses).
2. Quasi-Identifiers: Job titles, unique physical traits, or landmarks that could re-identify someone.

For every risk found, provide:
- 'original_text': The text to hide.
- 'category': Why it's a risk (e.g., 'Quasi-Identifier').
- 'vague_ifier': A safe replacement (e.g., 'The high school' instead of 'Lincoln High').
- 'reason': Brief explanation of the risk.

Output must be ONLY a valid JSON object.
"""

def analyze_document(text_content):
    response = client.models.generate_content(
        model='gemini-3-flash-preview',
        contents=text_content,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type='application/json'
        )
    )

    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        print("Error: Model did not return valid JSON.")
        return response.text


# Read in ex.txt
file_path = './ex.txt'
with open(file_path, 'r') as file:
    sample_legal_text = file.read()
    results = analyze_document(sample_legal_text)
    print(json.dumps(results, indent=2))

