#!/usr/bin/env bash

KEY="brain_test_123"
BASE="http://127.0.0.1:3001"

echo ""
echo "PARABELLUM BRAIN STATUS"
echo "======================="
echo ""

echo "HEALTH"
curl -s -H "x-brain-key: $KEY" $BASE/internal/health | jq

echo ""
echo "PROJECT STATE"
curl -s -H "x-brain-key: $KEY" $BASE/internal/project-state | jq

echo ""
echo "REWARDS"
curl -s -H "x-brain-key: $KEY" $BASE/internal/rewards-status | jq

echo ""
echo "QUEUES"
curl -s -H "x-brain-key: $KEY" $BASE/internal/queues-status | jq

echo ""
echo "DONE"
