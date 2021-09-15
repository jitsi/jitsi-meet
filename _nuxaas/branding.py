#!/usr/bin/env python3

from argparse import ArgumentParser, Namespace
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
_LNAME_RE = compile("jitsi meet", flags=_FLAGS)
_SNAME_RE = compile("jitsi", flags=_FLAGS)


def _simple_trans(l_name: str, s_name: str) -> Callable[[Any], Any]:
    def cont(val: Any) -> Any:
        if not isinstance(val, str):
            return val
        else:
            v1 = _LNAME_RE.sub(l_name, val)
            v2 = _SNAME_RE.sub(s_name, v1)
            return v2

    return cont


def _map(fn: Callable[[Any], Any], x: Any) -> Any:
    if isinstance(x, Mapping):
        return {key: _map(fn, x=val) for key, val in x.items()}
    elif isinstance(x, Sequence) and not isinstance(x, (str, ByteString)):
        return tuple(_map(fn, x=el) for el in x)
    else:
        return fn(x)


def _parse_args() -> Namespace:
    parser = ArgumentParser()
    parser.add_argument("--l-name", required=True)
    parser.add_argument("--s-name", required=True)
    return parser.parse_args()


def main() -> None:
    args = _parse_args()

    cols, _ = get_terminal_size()
    line = linesep + cols * "-" + linesep
    trans = _simple_trans(args.l_name, args.s_name)

    for path in _LANG.glob("*.json"):
        raw = path.read_text()
        json = loads(raw)
        xformed = _map(trans, x=json)
        raw = dumps(xformed, check_circular=False, ensure_ascii=False, indent=4)
        path.write_text(raw)
        print(path, line, end="", file=stderr)

    for path in _TOP_LV.glob("*.html"):
        html = path.read_text()
        html = _LNAME_RE.sub(args.l_name, html)
        path.write_text(html)


main()
