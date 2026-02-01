#!/bin/bash

# Test the WooCommerce API endpoint
echo "Testing WooCommerce Products API..."
echo "===================================="
echo ""

# Test 1: Check if endpoint is accessible (no auth - should return 401)
echo "Test 1: Checking endpoint accessibility..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" https://basketballgearstore.abacusai.app/wp-json/wc/v3/products)
echo "$RESPONSE"
echo ""

# Test 2: Check single product endpoint
echo "Test 2: Checking system status..."
curl -s https://basketballgearstore.abacusai.app/wp-json/wc/v3/system_status | jq '.pod_integration'
echo ""
echo "===================================="
echo "Tests completed!"
