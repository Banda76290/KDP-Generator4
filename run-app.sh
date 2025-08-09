#!/bin/bash
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=256 --disable-proto=throw"
cd /home/runner/workspace
exec /nix/store/lz7iav1hd92jbv44zf2rdd7b2mj23536-nodejs-20.19.3/bin/node dist/index.js