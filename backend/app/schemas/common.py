"""Общие типы и сериализаторы схем.

Формат даты-времени в API — ``ГГГГ-ММ-ДДTЧЧ:ММ:СС`` (без микросекунд и зоны),
формат времени — ``ЧЧ:ММ``, формат даты — ``ГГГГ-ММ-ДД``.
"""

from __future__ import annotations

from datetime import date, datetime, time
from typing import Annotated

from pydantic import BaseModel, ConfigDict, PlainSerializer


def _serialize_datetime(value: datetime | None) -> str | None:
    return value.strftime("%Y-%m-%dT%H:%M:%S") if value else None


def _serialize_date(value: date | None) -> str | None:
    return value.isoformat() if value else None


def _serialize_time(value: time | None) -> str | None:
    return value.strftime("%H:%M") if value else None


#: Дата-время в формате ``2026-02-04T21:12:00``.
DateTimeOut = Annotated[
    datetime, PlainSerializer(_serialize_datetime, return_type=str | None, when_used="always")
]
#: Дата в формате ``2026-02-04``.
DateOut = Annotated[
    date, PlainSerializer(_serialize_date, return_type=str | None, when_used="always")
]
#: Время в формате ``21:00``.
TimeOut = Annotated[
    time, PlainSerializer(_serialize_time, return_type=str | None, when_used="always")
]


class ORMModel(BaseModel):
    """Базовая схема: позволяет строить модель из ORM-объекта."""

    model_config = ConfigDict(from_attributes=True)
