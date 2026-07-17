# Deploying to your Vultr server

Everything runs in Docker, so the only thing your server needs is Docker itself.
Total time: ~10 minutes.

## 1. SSH into the server

```bash
ssh root@YOUR_SERVER_IP
```

## 2. Install Docker (skip if already installed)

```bash
curl -fsSL https://get.docker.com | sh
```

Check it works: `docker compose version`

## 3. Get the code

```bash
git clone https://github.com/ezabushaar/ez.git marsa-matcher
cd marsa-matcher
git checkout claude/fragrance-perfume-matcher-vd2ww6
```

(Once the branch is merged to `master`, you can skip the checkout line.)

## 4. Configure

```bash
cp .env.example .env
nano .env
```

Fill in:

- `ADMIN_PASSWORD` — pick a strong password for the `/admin` area
- `WOO_URL`, `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET` — from your WordPress
  admin: **WooCommerce → Settings → Advanced → REST API → Add key** (Read)
- `ANTHROPIC_API_KEY` — from https://console.anthropic.com (optional but
  recommended; enables AI perfume lookup + the marketing generator)

## 5. Start the app

```bash
docker compose up -d --build
```

The app is now live at **http://YOUR_SERVER_IP:3000** — open it in a browser,
then sign in at `/admin` and click **Sync WooCommerce products**.

If port 3000 is blocked, allow it: `ufw allow 3000` (or open it in Vultr's
firewall panel if you use that).

## 6. (Recommended) Add a domain + HTTPS

1. In your DNS, add an **A record** pointing a subdomain (e.g.
   `match.yourdomain.com`) at your server IP.
2. Edit the `Caddyfile` in this repo and replace `match.example.com` with your
   subdomain.
3. Open the web ports and start the bundled Caddy proxy:

   ```bash
   ufw allow 80 && ufw allow 443
   docker compose --profile https up -d
   ```

Caddy obtains and renews the SSL certificate automatically. Your app is now at
**https://match.yourdomain.com**. You can then close port 3000 from the outside
(`ufw deny 3000`) — Caddy talks to the app over the internal Docker network.

## Updating to a new version

```bash
cd marsa-matcher
git pull
docker compose up -d --build
```

The database lives in `./data/marsa.db` on the host (mounted as a volume), so
products, mappings, and AI-looked-up perfumes survive updates and rebuilds.

## Backup

Everything worth backing up is one file:

```bash
cp data/marsa.db ~/marsa-backup-$(date +%F).db
```

## Troubleshooting

- **Logs:** `docker compose logs -f app`
- **Woo sync fails with 401:** regenerate the REST API key in WordPress and
  make sure `WOO_URL` starts with `https://`
- **Changed `.env`:** apply with `docker compose up -d` (recreates the container)
