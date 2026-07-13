#!/bin/bash
set -e

sandcastle docker build-image
npx tsx .sandcastle/main.ts
