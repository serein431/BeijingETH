from __future__ import annotations

from openai import OpenAI

from .models import LLMConfig


def chat(llm: LLMConfig, messages: list[dict[str, str]], temperature: float = 0.3) -> str:
    if not llm.api_key:
        raise RuntimeError("LLM api_key is required")
    if not llm.model:
        raise RuntimeError("LLM model is required")
    kwargs = {"api_key": llm.api_key}
    if llm.base_url:
        kwargs["base_url"] = llm.base_url
    client = OpenAI(**kwargs)
    response = client.chat.completions.create(
        model=llm.model,
        messages=messages,
        temperature=temperature,
    )
    return response.choices[0].message.content or ""


def extract_fenced(text: str, language: str) -> str:
    marker = f"```{language}"
    if marker in text:
        return text.split(marker, 1)[1].split("```", 1)[0].strip()
    if "```" in text:
        return text.split("```", 1)[1].split("```", 1)[0].strip()
    return text.strip()
