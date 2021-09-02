#!/usr/bin/env python3

from collections.abc import ByteString
from json import dumps, loads
from os import linesep
from pathlib import Path
from re import RegexFlag, compile
from shutil import get_terminal_size
from sys import stderr
from typing import Any, Callable, Mapping, Sequence

_TOP_LV = Path(__file__).resolve().parent.parent
_LANG = _TOP_LV / "lang"


_FLAGS = RegexFlag.MULTILINE | RegexFlag.IGNORECASE
_RE_1 = compile("jitsi meet", flags=_FLAGS)
_RE_2 = compile("jitsi", flags=_FLAGS)


def _simple_trans(val: Any) -> Any:
    if not isinstance(val, str):
        return val
    else:
        v1 = _RE_1.sub("τΛ Talk", val)
        v2 = _RE_2.sub("τΛ", v1)
        return v2


def _map(fn: Callable[[Any], Any], x: Any) -> Any:
    if isinstance(x, Mapping):
        return {key: _map(fn, x=val) for key, val in x.items()}
    elif isinstance(x, Sequence) and not isinstance(x, (str, ByteString)):
        return tuple(_map(fn, x=el) for el in x)
    else:
        return fn(x)


def main() -> None:
    cols, _ = get_terminal_size()
    line = linesep + cols * "-" + linesep
    for path in _LANG.glob("*.json"):
        raw = path.read_text()
        json = loads(raw)
        xformed = _map(_simple_trans, x=json)
        raw = dumps(xformed, check_circular=False, ensure_ascii=False, indent=4)
        path.write_text(raw)
        print(path, line, end="", file=stderr)

    for path in _TOP_LV.glob("*.html"):
        html = path.read_text()
        html = _RE_1.sub("τΛ Talk", html)
        path.write_text(html)


main()
