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

import subprocess
import tempfile
from pathlib import Path

from . import wire
from .git import run

FILE = 1

FILE_NAME = 1
FILE_PACKAGE = 2
FILE_MESSAGE = 4
FILE_ENUM = 5
FILE_SERVICE = 6

MESSAGE_NAME = 1
MESSAGE_FIELD = 2
MESSAGE_NESTED = 3
MESSAGE_ENUM = 4

FIELD_NAME = 1
FIELD_NUMBER = 3
FIELD_LABEL = 4
FIELD_TYPE = 5
FIELD_TYPE_NAME = 6

ENUM_NAME = 1
ENUM_VALUE = 2

ENUM_VALUE_NAME = 1
ENUM_VALUE_NUMBER = 2

SERVICE_NAME = 1
SERVICE_METHOD = 2

METHOD_NAME = 1
METHOD_INPUT = 2
METHOD_OUTPUT = 3

class ProtocMissing(RuntimeError):
    pass

def _qualify(scope: str, name: str) -> str:
    return name if not scope else f"{scope}.{name}"

def _collect_message(message: wire.Fields, scope: str, into: set[str]) -> None:
    own = _qualify(scope, wire.text(message, MESSAGE_NAME))
    into.add(f"message:{own}")

    for field in wire.messages(message, MESSAGE_FIELD):
        into.add(
            "field:{}:{}:{}:{}:{}:{}".format(
                own,
                wire.number(field, FIELD_NUMBER),
                wire.text(field, FIELD_NAME),
                wire.number(field, FIELD_TYPE),
                wire.text(field, FIELD_TYPE_NAME),
                wire.number(field, FIELD_LABEL),
            )
        )

    for nested in wire.messages(message, MESSAGE_NESTED):
        _collect_message(nested, own, into)

    for nested in wire.messages(message, MESSAGE_ENUM):
        _collect_enum(nested, own, into)

def _collect_enum(enumeration: wire.Fields, scope: str, into: set[str]) -> None:
    own = _qualify(scope, wire.text(enumeration, ENUM_NAME))
    into.add(f"enum:{own}")

    for value in wire.messages(enumeration, ENUM_VALUE):
        into.add(f"enumvalue:{own}:{wire.number(value, ENUM_VALUE_NUMBER)}:{wire.text(value, ENUM_VALUE_NAME)}")

def _collect_service(service: wire.Fields, scope: str, into: set[str]) -> None:
    own = _qualify(scope, wire.text(service, SERVICE_NAME))
    into.add(f"service:{own}")

    for method in wire.messages(service, SERVICE_METHOD):
        into.add(
            "method:{}:{}:{}:{}".format(
                own,
                wire.text(method, METHOD_NAME),
                wire.text(method, METHOD_INPUT),
                wire.text(method, METHOD_OUTPUT),
            )
        )

def _collect_file(descriptor: wire.Fields, into: set[str]) -> None:
    into.add(f"file:{wire.text(descriptor, FILE_NAME)}")
    scope = wire.text(descriptor, FILE_PACKAGE)

    for message in wire.messages(descriptor, FILE_MESSAGE):
        _collect_message(message, scope, into)

    for enumeration in wire.messages(descriptor, FILE_ENUM):
        _collect_enum(enumeration, scope, into)

    for service in wire.messages(descriptor, FILE_SERVICE):
        _collect_service(service, scope, into)

def proto_files(tree_root: Path) -> list[Path]:
    return sorted(path for path in tree_root.rglob("*.proto") if "protocol" in path.parts)

def proto_surface(tree_root: Path) -> set[str]:
    files = proto_files(tree_root)
    surface: set[str] = set()
    if not files:
        return surface

    include_root = tree_root.parent
    relative = [str(path.relative_to(include_root)) for path in files]

    with tempfile.TemporaryDirectory(prefix="scribe-descriptor-") as workspace:
        descriptor = Path(workspace) / "contract.desc"
        try:
            run(["protoc", "-I", ".", f"--descriptor_set_out={descriptor}", *relative], cwd=include_root)
        except FileNotFoundError as cause:
            raise ProtocMissing(
                "protoc is not installed. Install protobuf-compiler to compare protocol changes."
            ) from cause
        except subprocess.CalledProcessError:
            raise

        payload = descriptor.read_bytes()

    for descriptor_file in wire.messages(wire.parse(payload), FILE):
        _collect_file(descriptor_file, surface)

    return surface
