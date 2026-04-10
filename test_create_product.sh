#!/bin/bash

# Simple test to create a product
curl -X POST "http://localhost:3000/wp-json/wc/v3/products?consumer_key=ck_50d3828f41e7a0ec0b65831450c9d61c&consumer_secret=cs_7b2eb0dbe03c382a575b74a0fca8eb1527b54fe81a1529fb6a2a19453be9619e" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Jetprint Product",
    "regular_price": "29.99",
    "sku": "JP-TEST-001"
  }' --max-time 30 2>&1 | head -200

echo ""
echo "=== Server logs ==="
tail -20 /tmp/nextjs_server.log
