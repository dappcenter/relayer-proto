#!/bin/bash

set -e

echo ""
echo "It's time to BUILD! All resistance is futile."
echo ""

# Rebuild gRPC to for docker target
npm rebuild grpc --target_arch=x64 --target_platform=linux --target_libc=glibc
rm -f ./proto/relayer.proto
npm run proto
npm test
