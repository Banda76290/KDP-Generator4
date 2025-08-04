#!/bin/bash
# Wrapper script to run tsx through npx
export PATH="/nix/store/djy8g4cghlw19fmy6zblim1waxkr7mf2-npx/bin:$PATH"
exec npx tsx "$@"