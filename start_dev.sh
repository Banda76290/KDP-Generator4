#!/bin/bash
cd /home/runner/workspace
NODE_ENV=development node --loader tsx/esm server/index.ts
