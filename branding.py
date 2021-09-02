#!/usr/bin/env python3

from collections.abc import ByteString
from json import dumps, loads
from json.decoder import JSONDecodeError
from pathlib import Path
from re import RegexFlag, compile
from sys import stderr
from typing import Any, Callable, Mapping, Sequence

_TOP_LV = Path(__file__).resolve().parent
_LANG = _TOP_LV / "lang"

_RE_1 = compile("jitsi meet", flags=RegexFlag.IGNORECASE)
_RE_2 = compile("jitsi", flags=RegexFlag.IGNORECASE)


def _simple_trans(val: Any) -> Any:
    if not isinstance(val, str):
        return val
    else:
        val = _RE_1.sub("τΛ Talk", val)
        val = _RE_2.sub("τΛ", val)
        return val


def _map(fn: Callable[[Any], Any], x: Any) -> Any:
    if isinstance(x, Mapping):
        return {key: fn(val) for key, val in x.items()}
    elif isinstance(x, Sequence) and not isinstance(x, (str, ByteString)):
        return tuple(_map(fn, x=el) for el in x)
    else:
        return x


def main() -> None:
    for path in _LANG.glob("*.json"):
        raw = path.read_text()
        try:
            json = loads(raw)
        except JSONDecodeError:
            print(path, file=stderr)
            break
        else:
            xformed = _map(_simple_trans, x=json)
            raw = dumps(xformed, check_circular=False, ensure_ascii=False, indent=2)
            path.write_text(raw)


main()
