# GoblinTime
An educational clone of FaceTime themed to goblins. Built with a distributed system architecture for PRO290.

## Services
- **LiveKit** — WebRTC SFU and signaling
- **coturn** — STUN/TURN server for NAT traversal

## Prerequisites
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [helm](https://helm.sh/docs/intro/install/)
- [tilt](https://docs.tilt.dev/install.html)

## First time setup
These steps only need to be done once when setting up the cluster for the first time.

### 1. Create the cluster
```bash
kind create cluster --config Infra/kind-config.yaml --name videocall
```

### 2. Install MetalLB
```bash
helm install metallb metallb/metallb --namespace metallb-system --create-namespace
kubectl apply -f Infra/metallb-pool.yaml
```

### 3. Create secrets
In the Tilt UI at localhost:10350, manually trigger the `create-secrets` resource.
Or run directly:
```bash
bash Infra/create-secrets.sh
```

## Daily development
Every time you restart your laptop, start the cluster back up then just run:
```bash
tilt up
```
Tilt will apply all configs and deployments automatically and watch for changes.
To stop:
```bash
tilt down
```
