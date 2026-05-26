#!/bin/bash
kubectl create secret generic livekit-secrets \
  --from-literal=api_key=myapp-dev \
  --from-literal=api_secret=$(openssl rand -base64 32) \
  --from-literal=turn_secret=$(openssl rand -base64 32)

kubectl create secret generic coturn-secrets \
  --from-literal=turn_secret=$(kubectl get secret livekit-secrets \
  -o jsonpath='{.data.turn_secret}' | base64 --decode)
