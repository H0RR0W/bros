#!/bin/sh
# Generate self-signed TLS certificate for local development
# Run once before docker-compose up

CERTS_DIR="$(dirname "$0")/certs"
mkdir -p "$CERTS_DIR"

openssl req -x509 \
  -newkey rsa:4096 \
  -keyout "$CERTS_DIR/server.key" \
  -out "$CERTS_DIR/server.crt" \
  -sha256 \
  -days 365 \
  -nodes \
  -subj "/C=RU/ST=Rostov/L=Rostov-on-Don/O=CyberSim/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "✓ Certificates generated in $CERTS_DIR"
echo "  server.crt — public certificate"
echo "  server.key — private key"
