#!/bin/bash
set -e

npx sandcastle docker build-image
npx tsx .sandcastle/main.ts
