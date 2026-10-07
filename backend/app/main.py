"""Точка входа приложения FastAPI.

Собирает приложение: CORS, подключение роутеров, отдачу загруженных файлов
по ``/uploads`` и единую обработку ошибок с русскими сообщениями.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api import achievements, auth, categories, habits, statistics, users
from app.core.config import settings

logger = logging.getLogger("habitquest")

#: Сообщения-заглушки Starlette, переведённые на русский язык.
_DEFAULT_MESSAGES: dict[str, str] = {
    "Not Found": "Запрашиваемый ресурс не найден",
    "Method Not Allowed": "Метод не поддерживается для этого адреса",
    "Internal Server Error": "Внутренняя ошибка сервера",
}

#: Русские сообщения для стандартных ошибок валидации Pydantic v2.
_SIMPLE_MESSAGES: dict[str, str] = {
    "missing": "Обязательное поле",
    "string_type": "Ожидается строка",
    "bytes_type": "Ожидается строка байтов",
    "int_type": "Ожидается целое число",
    "int_parsing": "Ожидается целое число",
    "int_from_float": "Ожидается целое число",
    "float_type": "Ожидается число",
    "float_parsing": "Ожидается число",
    "bool_type": "Ожидается логическое значение (true или false)",
    "bool_parsing": "Ожидается логическое значение (true или false)",
    "list_type": "Ожидается список",
    "dict_type": "Ожидается объект",
    "date_parsing": "Неверный формат даты. Ожидается ГГГГ-ММ-ДД",
    "date_from_datetime_parsing": "Неверный формат даты. Ожидается ГГГГ-ММ-ДД",
    "date_from_datetime_inexact": "Неверный формат даты. Ожидается ГГГГ-ММ-ДД",
    "time_parsing": "Неверный формат времени. Ожидается ЧЧ:ММ",
    "time_delta_parsing": "Неверный формат интервала времени",
    "datetime_parsing": "Неверный формат даты и времени. Ожидается ГГГГ-ММ-ДДTЧЧ:ММ:СС",
    "datetime_from_date_parsing": "Неверный формат даты и времени. Ожидается ГГГГ-ММ-ДДTЧЧ:ММ:СС",
    "json_invalid": "Некорректный JSON в теле запроса",
    "string_pattern_mismatch": "Значение не соответствует требуемому формату",
    "url_parsing": "Некорректный адрес",
    "url_scheme": "Некорректная схема адреса",
    "value_error": "Некорректное значение",
}


def _translate_error(error: dict[str, Any]) -> dict[str, Any]:
    """Перевести одну ошибку валидации на русский язык."""
    error_type = str(error.get("type", "value_error"))
    ctx = error.get("ctx") or {}
    raw_message = str(error.get("msg", "") or "")
    location = [str(item) for item in error.get("loc", ())]
    message = ""

    if error_type == "string_too_short":
        minimum = ctx.get("min_length")
        if location and location[-1] == "password":
            message = f"Пароль должен содержать не менее {minimum} символов"
        else:
            message = f"Слишком короткое значение: минимум {minimum} символов"
    elif error_type == "string_too_long":
        message = f"Слишком длинное значение: максимум {ctx.get('max_length')} символов"
    elif error_type in {"greater_than", "greater_than_equal"}:
        message = f"Значение должно быть не меньше {ctx.get('ge', ctx.get('gt'))}"
    elif error_type in {"less_than", "less_than_equal"}:
        message = f"Значение должно быть не больше {ctx.get('le', ctx.get('lt'))}"
    elif error_type in {"literal_error", "enum"}:
        expected = ctx.get("expected")
        if expected:
            expected = str(expected).replace(" or ", ", ")
            message = f"Недопустимое значение. Допустимо: {expected}"
        else:
            message = "Недопустимое значение"
    elif error_type in _SIMPLE_MESSAGES:
        message = _SIMPLE_MESSAGES[error_type]
    else:
        message = raw_message

    if error_type == "value_error":
        text = raw_message.removeprefix("Value error, ").strip()
        if "email" in text.lower() or (location and location[-1] == "email"):
            message = "Некорректный адрес электронной почты"
        elif text:
            message = text

    value = error.get("input")
    if not isinstance(value, (str, int, float, bool)) and value is not None:
        value = str(value)[:200]

    return {"type": error_type, "loc": location, "msg": message, "input": value}


def _translate_errors(errors: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Перевести список ошибок валидации."""
    return [_translate_error(error) for error in errors]


def create_app() -> FastAPI:
    """Создать и настроить приложение FastAPI."""
    application = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "REST API трекера привычек с геймификацией HabitQuest. "
            "Полный контракт — в файле docs/API.md."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Каталог загрузок должен существовать до монтирования StaticFiles.
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    application.mount(
        "/uploads",
        StaticFiles(directory=str(settings.upload_path)),
        name="uploads",
    )

    application.include_router(auth.router, prefix="/api")
    application.include_router(users.router, prefix="/api")
    application.include_router(categories.router, prefix="/api")
    application.include_router(habits.router, prefix="/api")
    application.include_router(statistics.router, prefix="/api")
    application.include_router(achievements.router, prefix="/api")

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Ошибки валидации: ``422`` и список полей с русскими сообщениями."""
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": _translate_errors(exc.errors())},
        )

    @application.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        """HTTP-ошибки в едином формате ``{"detail": "..."}``."""
        detail = exc.detail
        if isinstance(detail, str) and detail in _DEFAULT_MESSAGES:
            detail = _DEFAULT_MESSAGES[detail]
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": detail},
            headers=getattr(exc, "headers", None),
        )

    @application.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Необработанные исключения: ``500`` без раскрытия внутренних деталей."""
        logger.exception("Необработанная ошибка при обработке %s", request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Внутренняя ошибка сервера"},
        )

    @application.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        """Короткая справка о сервисе."""
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": "/docs",
            "api": "/api",
        }

    return application


app = create_app()
