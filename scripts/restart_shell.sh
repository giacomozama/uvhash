#!/bin/bash

export SHELL_ACCENT_1=$1
export SHELL_ACCENT_2=$2

killall hyprpaper
hyprctl dispatch "hl.dsp.exec_cmd('hyprpaper')"

killall gjs
hyprctl dispatch "hl.dsp.exec_cmd('ags run --gtk 4 $RICE_HOME/shell/app.ts')"
