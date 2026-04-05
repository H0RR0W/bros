# 🛡 CyberGuard

> **Образовательный симулятор кибербезопасности** — геймифицированная платформа для обучения пользователей распознаванию и отражению кибератак.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-latest-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io)
[![Mistral AI](https://img.shields.io/badge/Mistral_AI-mistral--small--latest-orange)](https://mistral.ai)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docker.com)

---

## Содержание

- [Описание](#описание)
- [Архитектура](#архитектура)
- [Стек технологий](#стек-технологий)
- [Быстрый старт](#быстрый-старт)
- [Конфигурация](#конфигурация)
- [API документация](#api-документация)
- [База данных](#база-данных)
- [Игровая механика](#игровая-механика)
- [Killer Feature: AI-режим](#killer-feature-ai-режим)
- [Администрирование](#администрирование)

---

## Описание

CyberGuard — браузерная игра в стиле pixel-art, в которой пользователь проходит сценарии реальных кибератак (фишинг, BEC, deepfake, MITM и др.) и учится их распознавать. Прогресс фиксируется в XP и лигах, лучшие игроки попадают в таблицу лидеров, а после завершения уровня «Дом» выдаётся персональный сертификат PDF.

**Killer Feature** — AI-режим: Mistral AI генерирует уникальный сценарий атаки в реальном времени, поэтому содержание никогда не повторяется.

---

## Архитектура

```
                        NGINX (80/443)
                       /             \
              Frontend (Next.js)   Backend (FastAPI)
                                     /     |    \
                              PostgreSQL  Redis  Mistral AI API
```

**5 Docker-контейнеров:**

| Сервис | Образ | Порт |
|--------|-------|------|
| `nginx` | nginx:alpine | 80, 443 |
| `frontend` | node:20-alpine | 3000 (internal) |
| `backend` | python:3.12-slim | 8000 (internal) |
| `postgres` | postgres:16-alpine | 5432 (internal) |
| `redis` | redis:7-alpine | 6379 (internal) |

---

## Стек технологий

### Frontend
| Технология | Версия | Назначение |
|------------|--------|------------|
| Next.js | 16.2.2 | React-фреймворк, App Router |
| React | 19.2.4 | UI |
| TypeScript | 5 | Типизация |
| Tailwind CSS | 4 | Утилитарные стили |
| jsPDF | 2.5.2 | Генерация PDF-сертификата без диалога печати |

> Весь pixel-art дизайн реализован на чистом CSS/SVG без UI-библиотек.

### Backend
| Технология | Версия | Назначение |
|------------|--------|------------|
| FastAPI | latest | REST API + WebSocket |
| SQLAlchemy | 2.x async | ORM |
| Alembic | latest | Миграции базы данных |
| PostgreSQL | 16 | Основная БД |
| Redis | 7 | Таблица лидеров (Sorted Sets) + кеш AI |
| passlib/bcrypt | 4.0.1 | Хеширование паролей |
| python-jose | latest | JWT-токены (HS256) |
| Pydantic | v2 | Валидация данных |

### AI
| Технология | Назначение |
|------------|------------|
| Mistral AI API | Генерация сценариев атак |
| `mistral-small-latest` | Модель |
| JSON Mode | Структурированный вывод |
| Redis TTL 24ч | Кеш сгенерированных сценариев |

---

## Быстрый старт

### Требования

- Docker Desktop 24+
- Docker Compose v2

### 1. Клонировать репозиторий

```bash
git clone https://github.com/<your-username>/CyberGuard.git
cd CyberGuard
```

### 2. Создать файл окружения

```bash
cp .env.example .env
```

Заполнить `.env` (минимально необходимые переменные):

```env
# База данных
DATABASE_URL=postgresql+asyncpg://cybersim:password@postgres:5432/cybersim
POSTGRES_PASSWORD=password

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
SECRET_KEY=your-very-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# Mistral AI (обязательно для AI-режима)
MISTRAL_API_KEY=your_mistral_api_key
MISTRAL_MODEL=mistral-small-latest

# Первый администратор
FIRST_ADMIN_EMAIL=admin@example.com
FIRST_ADMIN_PASSWORD=Admin_secure_pass123!
```

### 3. Запустить

```bash
docker compose up -d
```

При первом запуске автоматически:
- Применятся все Alembic-миграции (001 → 003)
- Создастся аккаунт администратора (`FIRST_ADMIN_EMAIL`)
- Сидируются базовые сценарии атак

### 4. Открыть в браузере

```
https://localhost
```

> ⚠ Сертификат SSL самоподписанный — в браузере потребуется принять исключение.

### Swagger UI (документация API)

```
https://localhost/docs
```

### Полезные команды

```bash
# Просмотр логов
docker compose logs -f backend

# Остановить
docker compose down

# Пересобрать после изменений кода
docker compose build && docker compose up -d

# Подключиться к PostgreSQL
docker compose exec postgres psql -U cybersim -d cybersim

# Запустить миграции вручную
docker compose exec backend alembic upgrade head

# Назначить пользователя администратором
docker compose exec postgres psql -U cybersim -d cybersim \
  -c "UPDATE users SET role = 'admin' WHERE email = 'user@example.com';"
```

---

## Конфигурация

Все переменные окружения задаются в `.env` (см. `.env.example`):

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `DATABASE_URL` | — | URL PostgreSQL (asyncpg) |
| `REDIS_URL` | `redis://redis:6379/0` | URL Redis |
| `SECRET_KEY` | — | Секрет для JWT, минимум 32 символа |
| `ALGORITHM` | `HS256` | Алгоритм JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Время жизни access-токена |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `30` | Время жизни refresh-токена |
| `MISTRAL_API_KEY` | — | API-ключ Mistral AI |
| `MISTRAL_BASE_URL` | `https://api.mistral.ai/v1` | Endpoint Mistral |
| `MISTRAL_MODEL` | `mistral-small-latest` | Модель |
| `MISTRAL_TIMEOUT` | `30` | Таймаут запросов к AI (сек) |
| `SCENARIO_CACHE_TTL` | `86400` | TTL кеша AI-сценариев в Redis (сек) |
| `ALLOWED_ORIGINS` | `http://localhost:3000,...` | CORS origins |
| `FIRST_ADMIN_EMAIL` | `admin@cybersim.local` | Email первого администратора |
| `FIRST_ADMIN_PASSWORD` | — | Пароль первого администратора |

---

## API документация

- **Swagger UI:** `https://localhost/docs`
- **ReDoc:** `https://localhost/redoc`
- **OpenAPI YAML:** [`docs/openapi.yaml`](docs/openapi.yaml)

Полный список эндпоинтов:

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| POST | `/api/auth/register` | Регистрация | — |
| POST | `/api/auth/login` | Вход | — |
| POST | `/api/auth/refresh` | Обновить токен | — |
| POST | `/api/auth/logout` | Выход | ✓ |
| GET  | `/api/auth/me` | Профиль | ✓ |
| PATCH | `/api/auth/me/profile` | Обновить ФИО | ✓ |
| POST | `/api/auth/me/change-password` | Смена пароля | ✓ |
| GET  | `/api/game/scenarios/{location}` | Сценарии для уровня | ✓ |
| POST | `/api/game/start` | Начать сессию | ✓ |
| POST | `/api/game/answer` | Ответ на вопрос | ✓ |
| POST | `/api/game/complete` | Завершить сессию | ✓ |
| POST | `/api/game/submit-result` | Записать итог | ✓ |
| GET  | `/api/game/ai-generate` | AI-сценарий (Mistral) | ✓ |
| GET  | `/api/users/me/stats` | Статистика | ✓ |
| GET  | `/api/users/me/history` | История сессий | ✓ |
| GET  | `/api/leaderboard` | Таблица лидеров | ✓ |
| GET  | `/api/leaderboard/me` | Мой ранг | ✓ |
| GET  | `/api/certificates/me` | Мои сертификаты | ✓ |
| GET  | `/api/certificates/verify/{code}` | Верификация | — |
| GET  | `/api/admin/users` | Список пользователей | admin |
| DELETE | `/api/admin/users/{id}` | Удалить пользователя | admin |
| PATCH | `/api/admin/users/{id}/edit` | Редактировать | admin |
| PATCH | `/api/admin/users/{id}/role` | Сменить роль | admin |
| PATCH | `/api/admin/users/{id}/status` | Вкл/выкл | admin |
| GET  | `/api/admin/stats` | Статистика платформы | admin |
| GET  | `/api/admin/scenarios` | Все сценарии | admin |
| POST | `/api/admin/scenarios` | Создать сценарий | admin |
| PUT  | `/api/admin/scenarios/{id}` | Обновить сценарий | admin |
| DELETE | `/api/admin/scenarios/{id}` | Удалить сценарий | admin |
| PATCH | `/api/admin/scenarios/{id}/publish` | Публикация | admin |
| GET  | `/api/admin/logs` | Логи администраторов | admin |
| WS   | `/ws/game/{session_id}` | Real-time обновления | ✓ |

---

## База данных

Полная ER-диаграмма: [`docs/ER_DIAGRAM.md`](docs/ER_DIAGRAM.md)

**Таблицы:**

| Таблица | Назначение |
|---------|------------|
| `users` | Пользователи: аутентификация, XP, лига, ФИО |
| `scenarios` | Сценарии атак: текст, варианты ответов, CWE/OWASP |
| `game_sessions` | Игровые сессии пользователей |
| `user_choices` | Ответы пользователей в сессиях |
| `certificates` | Выданные сертификаты |
| `admin_logs` | Логи действий администраторов |

**Миграции Alembic:**

| Версия | Описание |
|--------|----------|
| `001` | Начальная схема (users, scenarios, game_sessions, user_choices, certificates) |
| `002` | Добавлены поля профиля (first_name, last_name, patronymic) |
| `003` | Добавлена таблица admin_logs |

---

## Игровая механика

### Прогрессия уровней

```
ОФИС (всегда открыт)
  └─► ДОМ  (открывается при лиге != "Новичок", т.е. 300+ XP)
        └─► WI-FI  (открывается после прохождения уровня ДОМ)
              └─► Сертификат PDF  (генерируется после ДОМ)
```

### Ранги

| Ранг | XP | Уровень |
|------|----|---------|
| Новичок | 0 | 1 |
| Осведомлённый | 300 | 3 |
| Защитник | 800 | 6 |
| Эксперт | 1200 | 10 |

### Сценарий (5 шагов на уровень)

1. Пользователь получает текст ситуации атаки
2. Выбирает один из 4 вариантов ответа
3. Получает обратную связь (правильно/нет + объяснение)
4. HP уменьшается при неверном ответе
5. XP начисляется за каждый верный ответ

---

## Killer Feature: AI-режим

Отдельная зона на странице миссий. Mistral AI генерирует уникальный сценарий для каждой сессии.

**Поддерживаемые типы атак (12):**

| Тип | Описание |
|-----|----------|
| `phishing` | Email-фишинг |
| `bec` | Business Email Compromise |
| `social-engineering` | Социальная инженерия |
| `credential_stuffing` | Подстановка паролей |
| `vishing` | Голосовой фишинг |
| `deepfake` | Дипфейк-атаки |
| `mitm` | Атака посредника |
| `evil_twin` | Поддельная Wi-Fi точка |
| `password` | Атаки на пароли |
| `smishing` | SMS-фишинг |
| `qr_phishing` | QR-фишинг |
| `fake_app` | Поддельные приложения |

**Возвращаемые данные:** текст сценария · 4 варианта ответа · CWE-ID · OWASP категория · объяснения

---

## Администрирование

Панель администратора доступна по адресу `/admin` пользователям с ролью `admin`.

**Разделы:**
1. **Пользователи** — поиск, редактирование, смена роли/статуса, удаление
2. **Статистика** — метрики платформы, графики по локациям и типам атак
3. **Сценарии** — добавление кастомных сценариев атак
4. **Логи** — история действий всех администраторов

---

## Структура проекта

```
CyberGuard/
├── backend/
│   ├── app/
│   │   ├── admin/          # Панель администратора
│   │   ├── ai/             # Интеграция Mistral AI + fallback-сценарии
│   │   ├── auth/           # JWT-аутентификация, профиль
│   │   ├── certificates/   # Логика сертификатов
│   │   ├── game/           # Сценарии, сессии, ответы
│   │   ├── leaderboard/    # Redis-рейтинг
│   │   ├── users/          # Статистика пользователей
│   │   ├── websocket/      # Real-time WebSocket
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   └── main.py
│   ├── alembic/            # Миграции БД (001, 002, 003)
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── app/
│   │   ├── admin/          # Панель администратора
│   │   ├── certificate/    # Сертификат + jsPDF
│   │   ├── dashboard/      # Главная страница
│   │   ├── leaderboard/    # Таблица лидеров
│   │   ├── missions/       # Выбор уровня
│   │   ├── play/           # Геймплей + AI-режим
│   │   └── profile/        # Личный кабинет
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── WelcomeModal.tsx
│   ├── lib/api.ts
│   ├── public/agent.svg
│   └── Dockerfile
├── nginx/
│   ├── nginx.conf
│   └── certs/
├── docs/
│   ├── ER_DIAGRAM.md       # ER-диаграмма (Mermaid)
│   └── openapi.yaml        # OpenAPI 3.0 спецификация
├── docker-compose.yml
├── .env.example
└── README.md
```

---

