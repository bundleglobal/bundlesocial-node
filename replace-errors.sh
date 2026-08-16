#!/bin/bash

if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' -E "s/^([[:space:]]*)([0-9]{3}),?$/\1\2: '\2',/" ./client/services.gen.ts
else
  sed -i -E "s/^([[:space:]]*)([0-9]{3}),?$/\1\2: '\2',/" ./client/services.gen.ts
fi
