#!/bin/bash

# replace all errors in the file ./client/services.gen.ts
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' 's/400,/400: '"'"'400'"'"',/g' ./client/services.gen.ts
  sed -i '' 's/401,/401: '"'"'401'"'"',/g' ./client/services.gen.ts
  sed -i '' 's/403,/403: '"'"'403'"'"',/g' ./client/services.gen.ts
  sed -i '' 's/404,/404: '"'"'404'"'"',/g' ./client/services.gen.ts
  sed -i '' 's/429,/429: '"'"'429'"'"',/g' ./client/services.gen.ts
  sed -i '' 's/500/500: '"'"'500'"'"',/g' ./client/services.gen.ts
else
  sed -i 's/400,/400: '"'"'400'"'"',/g' ./client/services.gen.ts
  sed -i 's/401,/401: '"'"'401'"'"',/g' ./client/services.gen.ts
  sed -i 's/403,/403: '"'"'403'"'"',/g' ./client/services.gen.ts
  sed -i 's/404,/404: '"'"'404'"'"',/g' ./client/services.gen.ts
  sed -i 's/429,/429: '"'"'429'"'"',/g' ./client/services.gen.ts
  sed -i 's/500/500: '"'"'500'"'"',/g' ./client/services.gen.ts
fi