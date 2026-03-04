# Preplai Monitoring

Prometheus metrics, alert rules, and log shipping for the Preplai API and MCP server.

## Prometheus

### Local development

1. Install [Prometheus](https://prometheus.io/download/) or run via Docker:

   ```bash
   docker run -d --name prometheus \
     -p 9090:9090 \
     -v $(pwd)/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro \
     -v $(pwd)/monitoring/alerts.yml:/etc/prometheus/alerts.yml:ro \
     prom/prometheus:latest \
     --config.file=/etc/prometheus/prometheus.yml \
     --storage.tsdb.path=/prometheus
   ```

2. Ensure the API (`:5000`) and MCP server (`:5005`) are running.

3. Open http://localhost:9090 and query metrics (e.g. `http_requests_total`).

### Docker Compose

Add Prometheus to your stack:

```yaml
  prometheus:
    image: prom/prometheus:latest
    container_name: preplai-prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./monitoring/alerts.yml:/etc/prometheus/alerts.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'
    networks:
      - preplai-net

volumes:
  prometheus-data:
```

Update `monitoring/prometheus.yml` scrape targets to `api:5000` and `mcp:5005` when running in Docker. Expose port 9090 if you need external access.

### Alertmanager (optional)

To receive alerts (email, Slack, PagerDuty):

1. Install [Alertmanager](https://prometheus.io/docs/alerting/alertmanager/).
2. Configure `alerting.alertmanagers` in `prometheus.yml` with your Alertmanager URL.
3. Create an `alertmanager.yml` with receivers and routes.

## Alert Rules

| Alert           | Condition                                      | Severity |
|----------------|------------------------------------------------|----------|
| HighErrorRate  | 5xx rate > 5% for 5m                           | warning  |
| HighLatency    | P95 latency > 2s for 5m                       | warning  |
| ServiceDown    | Target unreachable for 1m                      | critical |
| DatabaseDown   | `mongodb_connection_ready_state != 1` for 2m  | critical |

## Log Shipping

The API and MCP server use [Pino](https://getpino.io/) and output JSON logs to stdout. To ship logs to a central system:

### Docker logging driver

Configure the Docker logging driver to send logs to Loki, Datadog, or another backend:

```bash
docker run --log-driver=loki \
  --log-opt loki-url="http://localhost:3100/loki/api/v1/push" \
  your-image
```

For Docker Compose:

```yaml
services:
  api:
    logging:
      driver: loki
      options:
        loki-url: "http://localhost:3100/loki/api/v1/push"
```

### systemd / bare metal

Redirect stdout to a log shipper or use `journald` and forward to your logging backend. Example with `pino-pretty` for local dev:

```bash
node apps/api/dist/index.js | pino-pretty
```

### Loki (Grafana stack)

- Run [Promtail](https://grafana.com/docs/loki/latest/clients/promtail/) or use the [Docker Loki driver](https://grafana.com/docs/loki/latest/clients/docker-driver/) to push container logs.
- Optional: use `pino-loki` or similar to push directly from the app (check compatibility with your Loki version).

### Datadog

Use the [Datadog Agent](https://docs.datadoghq.com/logs/log_collection/nodejs/) or Docker log collection to ingest JSON logs. Ensure `service` and `env` tags are set for filtering.
