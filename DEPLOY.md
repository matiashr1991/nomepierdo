# Checklist de Deploy Exacto (No Me Pierdo)

Este es el proceso exacto, paso a paso, para desplegar en tu VPS con Docker Swarm. La base de datos es el MySQL del host (no un contenedor) — ver `openspec/changes/migrate-postgres-to-mysql/design.md` para el porqué de la IP `172.18.0.1`.

## 1) Crear la carpeta y el archivo `.env-prod`

```bash
mkdir -p /opt/deploy/nomepierdo
chmod 755 /opt/deploy /opt/deploy/nomepierdo
nano /opt/deploy/nomepierdo/.env-prod
chmod 600 /opt/deploy/nomepierdo/.env-prod
```

(Pegá el contenido de `.env-prod.example` ahí adentro y completá las claves reales).

## 2) Bajar el código

```bash
mkdir -p /opt/stacks/nomepierdo
cd /opt/stacks/nomepierdo
git clone https://github.com/matiashr1991/nomepierdo.git .
```

*(Si ya lo clonaste, hacé `git pull`).*

## 3) Build local de la imagen en el VPS

```bash
cd /opt/stacks/nomepierdo

set -a
. /opt/deploy/nomepierdo/.env-prod
set +a

docker build \
  --build-arg NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
  -t nomepierdo:latest .
```

## 4) Deploy del stack

```bash
cd /opt/stacks/nomepierdo

set -a
. /opt/deploy/nomepierdo/.env-prod
set +a

docker stack deploy -c stack.yml nomepierdo
```

## 5) Inicializar la base de datos con Prisma (`db push`)

Como no usamos migraciones formales por ahora, empujamos el schema directamente. La base es el MySQL del host (`172.18.0.1:3306`, usuario `nomepierdo`, scoped solo a la base `nomepierdo`) — el contenedor efímero usa `--network host` para llegar ahí sin depender de una red overlay dedicada:

```bash
docker run --rm --network host \
  --env-file /opt/deploy/nomepierdo/.env-prod \
  -v /opt/stacks/nomepierdo:/app \
  -w /app \
  node:20-alpine \
  sh -lc "apk add --no-cache libc6-compat openssl && npm ci && npx prisma db push"
```

Después forzá el reinicio del servicio web para que tome la base de datos ya creada:

```bash
docker service update --force nomepierdo_web
```

## 6) Verificación Final

```bash
docker service ls | grep nomepierdo
docker service ps nomepierdo_web --no-trunc
docker service logs --since 5m nomepierdo_web

curl -kI https://127.0.0.1 -H 'Host: nomepierdo.mmatdev.com'
```

Si el curl devuelve `200` o `307/302`, está todo perfecto.
