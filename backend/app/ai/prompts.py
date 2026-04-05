SYSTEM_PROMPT = """
Ты генератор сценариев для образовательного симулятора кибербезопасности.
Создавай реалистичные, но полностью безвредные симуляции кибератак на русском языке.
Никогда не включай реальный вредоносный код, ссылки, исполняемые инструкции или реальные персональные данные.
Все домены, телефоны, имена — вымышленные.
Ответ только в JSON формате, без markdown-обёртки.
"""

USER_PROMPT_TEMPLATE = """
Создай сценарий симулированной кибератаки для обучения:

- Локация: {location}
- Тип атаки: {attack_type}
- CWE ID: {cwe_id} — {cwe_description}
- OWASP: {owasp_category} — {owasp_name}

Верни JSON строго в формате:
{{
  "scenario_text": "...",
  "answer_options": [
    {{"id": "A", "text": "...", "is_correct": false}},
    {{"id": "B", "text": "...", "is_correct": true}},
    {{"id": "C", "text": "...", "is_correct": false}},
    {{"id": "D", "text": "...", "is_correct": false}}
  ],
  "correct_answer_id": "B",
  "explanation_wrong": "Объяснение последствий + упоминание {cwe_id} ({cwe_description}). 2-3 предложения.",
  "explanation_correct": "Почему верно + правило + рекомендация по защите в духе Минцифры РФ / Лаборатории Касперского. Упомяни {owasp_category}. 2-3 предложения."
}}

Требования:
- scenario_text: реалистичный симулированный контент (письмо/сообщение/страница) на русском
- Ровно один верный вариант ответа (is_correct: true)
- explanation_wrong: описать последствия, сослаться на CWE
- explanation_correct: практический совет, сослаться на OWASP категорию, добавить конкретную рекомендацию (пример: «Минцифры РФ рекомендует...» или «Согласно гайдам Kaspersky...»)
"""

ATTACK_META = {
    "phishing": {
        "cwe_id": "CWE-1021",
        "cwe_description": "Improper Restriction of Rendered UI Layers — подмена интерфейса для обмана пользователя",
        "owasp_category": "OWASP A05",
        "owasp_name": "Security Misconfiguration — отсутствие проверки подлинности источника",
    },
    "bec": {
        "cwe_id": "CWE-506",
        "cwe_description": "Embedded Malicious Code — мошенничество через корпоративную почту",
        "owasp_category": "OWASP A07",
        "owasp_name": "Identification and Authentication Failures",
    },
    "social-engineering": {
        "cwe_id": "CWE-522",
        "cwe_description": "Insufficiently Protected Credentials — раскрытие данных через манипуляцию",
        "owasp_category": "OWASP A07",
        "owasp_name": "Identification and Authentication Failures",
    },
    "credential_stuffing": {
        "cwe_id": "CWE-307",
        "cwe_description": "Improper Restriction of Excessive Authentication Attempts",
        "owasp_category": "OWASP A07",
        "owasp_name": "Identification and Authentication Failures",
    },
    "vishing": {
        "cwe_id": "CWE-522",
        "cwe_description": "Insufficiently Protected Credentials — голосовой фишинг",
        "owasp_category": "OWASP A07",
        "owasp_name": "Identification and Authentication Failures",
    },
    "deepfake": {
        "cwe_id": "CWE-506",
        "cwe_description": "Embedded Malicious Code — синтезированный голос/видео для обмана",
        "owasp_category": "OWASP A07",
        "owasp_name": "Identification and Authentication Failures",
    },
    "mitm": {
        "cwe_id": "CWE-319",
        "cwe_description": "Cleartext Transmission of Sensitive Information — перехват незашифрованного трафика",
        "owasp_category": "OWASP A02",
        "owasp_name": "Cryptographic Failures — отсутствие шифрования канала",
    },
    "evil_twin": {
        "cwe_id": "CWE-300",
        "cwe_description": "Channel Accessible by Non-Endpoint — поддельная точка доступа Wi-Fi",
        "owasp_category": "OWASP A02",
        "owasp_name": "Cryptographic Failures",
    },
    "password": {
        "cwe_id": "CWE-521",
        "cwe_description": "Weak Password Requirements — слабые или скомпрометированные пароли",
        "owasp_category": "OWASP A07",
        "owasp_name": "Identification and Authentication Failures",
    },
    "smishing": {
        "cwe_id": "CWE-1021",
        "cwe_description": "Improper Restriction of Rendered UI Layers — SMS-фишинг",
        "owasp_category": "OWASP A05",
        "owasp_name": "Security Misconfiguration",
    },
    "qr_phishing": {
        "cwe_id": "CWE-441",
        "cwe_description": "Unintended Proxy or Intermediary — QR-коды как вектор фишинга",
        "owasp_category": "OWASP A03",
        "owasp_name": "Injection",
    },
    "fake_app": {
        "cwe_id": "CWE-359",
        "cwe_description": "Exposure of Private Personal Information — поддельные приложения",
        "owasp_category": "OWASP A06",
        "owasp_name": "Vulnerable and Outdated Components",
    },
}


def build_prompt(location: str, attack_type: str) -> str:
    meta = ATTACK_META.get(
        attack_type,
        {
            "cwe_id": "CWE-1021",
            "cwe_description": "Improper Restriction of Rendered UI Layers",
            "owasp_category": "OWASP A05",
            "owasp_name": "Security Misconfiguration",
        },
    )
    return USER_PROMPT_TEMPLATE.format(
        location=location,
        attack_type=attack_type,
        **meta,
    )
