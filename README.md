
# S3 Browser

A self-hosted S3 browser and uploader. Works with AWS S3, Wasabi, Backblaze B2, Cloudflare R2, MinIO, and any S3-compatible provider.

## Quick Start

### With Docker Compose (recommended)

```bash
# Default password is "admin"
docker compose up -d

# Set a custom password
APP_PASSWORD=mysecretpassword docker compose up -d
```

Open http://localhost:3000

### With Docker

```bash
docker build -t s3browser .

docker run -d \
  -p 3000:3000 \
  -e APP_PASSWORD=mysecretpassword \
  -e SESSION_SECRET=a_long_random_string_here \
  --name s3browser \
  s3browser
```

## Environment Variables

| Variable         | Default   | Description                          |
|------------------|-----------|--------------------------------------|
| `APP_PASSWORD`   | `admin`   | Login password for the web UI        |
| `SESSION_SECRET` | random    | Secret for signing session cookies   |
| `PORT`           | `3000`    | Port to listen on                    |

## Provider Setup Examples

### AWS S3
- Endpoint: *(leave blank)*
- Region: `us-east-1` (or your bucket's region)
- Force path-style: off

### Wasabi
- Endpoint: `https://s3.wasabisys.com`
- Region: `us-east-1` (or your bucket's region, e.g. `eu-central-1`)
- Force path-style: off

### Backblaze B2
- Endpoint: `https://s3.us-west-004.backblazeb2.com` (check your bucket's endpoint)
- Region: `us-west-004` (match your bucket)
- Force path-style: off

### Cloudflare R2
- Endpoint: `https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com`
- Region: `auto`
- Force path-style: off

### MinIO (local)
- Endpoint: `http://your-minio-host:9000`
- Region: `us-east-1`
- Force path-style: **on**

## Security Notes

- Credentials are stored **in the server-side session only** — never persisted to disk
- Use a strong `APP_PASSWORD` and a random `SESSION_SECRET` in production
- Run behind a reverse proxy (nginx/Caddy) with HTTPS in any non-local environment
- Sessions expire after 24 hours

## Features

- Login-protected web UI
- Connect to any S3-compatible provider
- Browse buckets and folders
- Upload files with real progress bars (drag-and-drop or file picker)
- Download files via presigned URLs
- Delete files and folders
- Search within current folder
=======
# S3Browser
