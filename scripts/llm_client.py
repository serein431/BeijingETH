from __future__ import annotations

from collections.abc import Generator

from openai import OpenAI

from .models import LLMConfig


def _client(llm: LLMConfig) -> OpenAI:
    if not llm.api_key:
        raise RuntimeError("LLM api_key is required")
    if not llm.model:
        raise RuntimeError("LLM model is required")
    kwargs: dict[str, str] = {"api_key": llm.api_key}
    if llm.base_url:
        kwargs["base_url"] = llm.base_url
    return OpenAI(**kwargs)


def chat(llm: LLMConfig, messages: list[dict[str, str]], temperature: float = 0.3) -> str:
    client = _client(llm)
    response = client.chat.completions.create(
        model=llm.model,
        messages=messages,
        temperature=temperature,
    )
    return response.choices[0].message.content or ""


def chat_stream(llm: LLMConfig, messages: list[dict[str, str]], temperature: float = 0.3) -> Generator[str, None, None]:
    client = _client(llm)
    stream = client.chat.completions.create(
        model=llm.model,
        messages=messages,
        temperature=temperature,
        stream=True,
    )
    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


def extract_fenced(text: str, language: str) -> str:
    marker = f"```{language}"
    if marker in text:
        return text.split(marker, 1)[1].split("```", 1)[0].strip()
    if "```" in text:
        return text.split("```", 1)[1].split("```", 1)[0].strip()
    return text.strip()
