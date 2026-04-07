# Arquitetura proposta — Alta Disponibilidade (AI Studio / Google Cloud)

Resumo curto
- Objetivo: executar a aplicação com alta disponibilidade, tolerância a falhas regionais e suporte a malha P2P local (BLE/Wi‑Fi) + fallback em nuvem.
- Base: usar Cloud Run / Secret Manager / Pub/Sub / Cloud Storage / Cloud SQL (ou Firestore) e relays TURN em Cloud Run.

Componentes principais
- Front: Load Balancer (HTTPS) + Cloud CDN para assets estáticos.
- Serviços: Cloud Run (containerizados) rodando API, relays TURN, workers (backgrounds).
- Mensageria/coordenação: Pub/Sub para eventos; Cloud Tasks para jobs assíncronos.
- Estado durável: Cloud SQL (Postgres) ou Firestore para IdentityRegistry, metadados; Cloud Storage para backups/shards.
- Cache/locks: Memorystore (Redis) para locks/leader-election e caches LQM temporários.
- Segredos: Secret Manager para GEMINI_API_KEY, keys privadas; injetar em Cloud Run.
- Observabilidade: Cloud Monitoring / Logging / Trace, health endpoints e readiness.

Resiliência multi-região
- Deploy em 2+ regiões (Cloud Run replicas). Load Balancer com failover entre regiões.
- DB com réplica cross-region (Cloud SQL replicas) ou Firestore multi-region.
- Backups automáticos para Cloud Storage (encriptados).

P2P híbrido (edge-first)
- Dispositivos preservam a malha local (BLE/Wi‑Fi). Quando conexão direta falha, usar relays TURN em Cloud Run.
- Pub/Sub + bridge workers sincronizam eventos entre regiões para consistência eventual (gossip bridge).

Segurança e chaveamento
- Todas as chaves e tokens no Secret Manager; rotação automatizada via CI/CD.
- Criptografia local E2EE; no servidor armazenar apenas blobs cifrados; backups cifrados com KMS.

Observability & SLOs
- Health endpoints `/healthz` e `/ready` com readiness checks em startup.
- Métricas: LQM, nodes aktivos, latência média, messages/s, FEC recovery rate.
- Alertas: erros 5xx, latência > SLO, queda de replicas regionais.

Artefatos a gerar (próximos passos)
1. `Dockerfile` e `/.dockerignore` para a app (build + health endpoint).
2. `terraform/` scaffold para Cloud Run, IAM, Secret Manager, Pub/Sub e Memorystore.
3. Prototype TURN relay em `services/relay/` (Cloud Run).
4. CI/CD (Cloud Build) pipeline que constrói imagem, publica em Artifact Registry e atualiza Cloud Run.

Diagrama (Mermaid):

```mermaid
flowchart LR
  LB[Global HTTPS Load Balancer]
  CDN[Cloud CDN]
  subgraph GCP
    LB --> CDN
    CDN --> CR1[Cloud Run (region A)]
    CDN --> CR2[Cloud Run (region B)]
    CR1 --> PUB[Pub/Sub]
    CR2 --> PUB
    PUB --> WORK[Background Workers / Cloud Run]
    CR1 --> DB[(Cloud SQL / Firestore)]
    CR2 --> DB
    CR1 --> REDIS[Memorystore (Redis)]
    CR2 --> REDIS
    WORK --> STORAGE[Cloud Storage (backups/shards)]
    CR1 --> RELAY[TURN Relay (Cloud Run autoscale)]
    CR2 --> RELAY
    SECRET[Secret Manager] --> CR1
    SECRET --> CR2
  end

  Device[(Mobile / Edge device)]
  Device -->|BLE/WiFi P2P| Device2[(Peer)]
  Device -->|WAN fallback (TURN)| RELAY
  RELAY --> PUB

```

Observações finais
- Prefiro começar gerando o `Dockerfile` e um health endpoint mínimo no repositório (stage C). Se quiser, antes eu inspeciono o projeto adicional em `c:\Users\Kbite\Documents\audio e b plugin` para puxar artefatos ou scripts úteis.

— Arquitetura gerada pelo assistente (baseado nos PDFs extraídos)
