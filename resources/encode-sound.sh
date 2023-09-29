#!/bin/bash

usage() {
  echo "Usage: $0 [--mp3] [--opus] [--stereo] <input file ...>"
  exit 1
}

for arg in "$@"; do
  case "$arg" in
    --stereo)
    STEREO=true
    shift
    ;;
    --mp3)
    MP3=true
    shift
    ;;
    --opus)
    OPUS=true
    shift
    ;;
  esac
done

if [ $# -lt 1 ] ;then
  usage
fi

if [ "$MP3" != "true" ] ;then
  if [ "$OPUS" != "true" ] ;then
    echo "At least one of --mp3 or --opus is required"
    usage
  fi
fi

echo "STEREO=$STEREO MP3=$MP3 OPUS=$OPUS"

AC1="-ac 1"
if [ "$STEREO" = "true" ] ;then
  AC1=""
fi

for i in "$@" ;do
  if [ "$MP3" = "true" ] ;then
    ffmpeg -i "$i" -codec:a libmp3lame -qscale:a 9 -map_metadata -1 $AC1 "${i%.*}.mp3"
  fi
  if [ "$OPUS" = "true" ] ;then
    ffmpeg -i "$i" -c:a libopus -b:a 30k -vbr on -compression_level 10 -map_metadata -1 $AC1 "${i%.*}.opus"
  fi
done
