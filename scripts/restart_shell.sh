#!/bin/bash

export SHELL_ACCENT_1=$1
export SHELL_ACCENT_2=$2

killall hyprpaper
hyprctl dispatch exec hyprpaper

killall walker
hyprctl dispatch exec "$RICE_HOME/walker --gapplication-service"

killall gjs
hyprctl dispatch exec "ags run --gtk 4 $RICE_HOME/shell/app.ts"
