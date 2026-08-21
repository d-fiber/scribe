# Copyright (C) 2026 Fiber
#
# This Source Code Form is subject to the terms of the Mozilla Public License,
# v. 2.0. If a copy of the MPL was not distributed with this file, You can
# obtain one at https://mozilla.org/MPL/2.0/.
#
# What you may do:
# - Use this software for any purpose, including commercially, and build and
#   sell your own products on top of it.
# - Change it, and create new works based on it.
# - Distribute copies of it, with or without your changes.
# - Combine it with files under any other licence, proprietary ones included,
#   and licence that larger work on your own terms.
#
# What you must do in return:
# - Keep this notice on every file you received it on.
# - Publish, under these same terms, the source of every file covered by them
#   that you distribute, including the ones you changed, so that whoever
#   receives your version can obtain that source.
# - Leave Fiber out of it: the name "Fiber", its branding, its logos and its
#   trademarks may not be used to endorse or promote what you build, and this
#   licence grants no right to them.
#
# Disclaimer:
# AS FAR AS THE LAW ALLOWS, THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
# OR CONDITION OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
# WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
# NON-INFRINGEMENT. IN NO EVENT SHALL FIBER BE LIABLE FOR ANY DIRECT, INDIRECT,
# INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT
# LIMITED TO LOSS OF USE, DATA, PROFITS, OR BUSINESS INTERRUPTION) ARISING OUT
# OF OR RELATED TO THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY
# KIND OF LEGAL CLAIM.
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
