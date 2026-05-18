# GoblinTime
An educational clone of FaceTime themed to goblins. Built with a distributed system architecture for PRO290.

## Services
- **LiveKit** — WebRTC SFU and signaling
- **coturn** — STUN/TURN server for NAT traversal

## Starting LiveKit and coturn locally

> **Note:** The kind cluster loses all state when your laptop shuts down. Run these steps every time you restart.

### 1. Start the cluster
```bash
kind create cluster --config Infra/kind-config.yaml --name videocall
```

### 2. Install MetalLB
```bash
helm install metallb metallb/metallb --namespace metallb-system --create-namespace
kubectl apply -f Infra/metallb-pool.yaml
```

### 3. Recreate secrets
```bash
bash Infra/create-secrets.sh
```

### 4. Apply everything
```bash
kubectl apply -f LiveKit/livekit-configmap.yaml
kubectl apply -f LiveKit/livekit-deployment.yaml
kubectl apply -f Turn/coturn-configmap.yaml
kubectl apply -f Turn/coturn-deployment.yaml
```
