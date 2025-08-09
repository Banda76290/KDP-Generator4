#!/bin/bash
exec node --loader ts-node/esm/transpile-only "$@"