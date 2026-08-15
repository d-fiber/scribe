# Copyright (C) 2026 Fiber
#
# This file is part of scribe and is made available under the PolyForm Shield
# License 1.0.0. The full terms are in the LICENSE file at the root of this
# repository, and at https://polyformproject.org/licenses/shield/1.0.0
#
# What you may do:
# - Use this software for any purpose, including commercially, and build and
#   sell your own products on top of it.
# - Change it, and create new works based on it.
# - Distribute copies of it, with or without your changes.
#
# The one thing you may not do:
# - Use it to provide any product that competes with scribe, or with any
#   product Fiber or its affiliates provide using scribe. Products compete
#   even when they are offered free of charge, through a different kind of
#   interface, or for a different technical platform.
#
# If you pass this software on:
# - Anyone who receives any part of it from you must also receive these terms,
#   or the URL above, together with the "Required Notice" line carried by the
#   LICENSE file.
#
# Disclaimer:
# AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
# CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
# OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
# LEGAL CLAIM.
#
# This header is a summary written for convenience. Where it differs from the
# LICENSE file, the LICENSE file governs.

from __future__ import annotations

Fields = dict[int, list[object]]

def _read_varint(data: bytes, index: int) -> tuple[int, int]:
    value = 0
    shift = 0
    while True:
        if index >= len(data):
            raise ValueError("truncated varint")
        byte = data[index]
        index += 1
        value |= (byte & 0x7F) << shift
        if not byte & 0x80:
            return value, index
        shift += 7

def parse(data: bytes) -> Fields:
    fields: Fields = {}
    index = 0

    while index < len(data):
        key, index = _read_varint(data, index)
        number, wire_type = key >> 3, key & 0x07

        if wire_type == 0:
            value, index = _read_varint(data, index)
        elif wire_type == 1:
            value, index = data[index:index + 8], index + 8
        elif wire_type == 2:
            length, index = _read_varint(data, index)
            value, index = data[index:index + length], index + length
        elif wire_type == 5:
            value, index = data[index:index + 4], index + 4
        else:
            raise ValueError(f"unsupported wire type {wire_type}")

        fields.setdefault(number, []).append(value)

    return fields

def messages(fields: Fields, number: int) -> list[Fields]:
    return [parse(value) for value in fields.get(number, []) if isinstance(value, bytes)]

def text(fields: Fields, number: int, fallback: str = "") -> str:
    values = fields.get(number, [])
    if not values or not isinstance(values[0], bytes):
        return fallback
    return values[0].decode("utf-8")

def number(fields: Fields, index: int, fallback: int = 0) -> int:
    values = fields.get(index, [])
    if not values or not isinstance(values[0], int):
        return fallback
    return values[0]
