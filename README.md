# S3 Browser

A high-performance, lightweight web interface for browsing and managing S3-compatible storage. Built with Node.js and a modern, minimalist frontend, it allows you to manage multiple S3 providers seamlessly from a single dashboard.

## 🚀 Key Features

- **Multi-Provider Management**: Store and switch between multiple S3 configurations (AWS, Wasabi, Backblaze B2, MinIO, Cloudflare R2).
- **Interactive Top-Bar**: Switch between providers and buckets instantly without reloading the page.
- **Advanced Upload Engine**:
  - Drag-and-drop support for files and nested directories.
  - Multi-part upload support for massive files.
  - Concurrency-limited queue (3 simultaneous uploads) to ensure browser stability.
- **Secure File Access**: Downloads are handled via short-lived presigned URLs.
- **Smart Breadcrumbs**: Fast navigation through complex directory structures.
- **Live Search**: Instant client-side filtering of objects in the current view.
- **Modern Dark UI**: Low-eyestrain interface with real-time stats (total size, object count).

## 🛠 Tech Stack

- **Backend**: Node.js, Express, AWS SDK v3.
- **Frontend**: Vanilla JavaScript (ES6+), CSS3 (Custom Variables).
- **Session**: Memory-based session (production-ready with `SESSION_SECRET`).

## 📥 Installation & Setup

### Using Docker (Recommended)

1. Clone the repository.
2. Build and start the service:
   ```bash
   docker compose up --build -d
   ```
3. Open [http://localhost:5000](http://localhost:5000) in your browser.

### Environment Variables

You can customize the following variables in your `docker-compose.yml` or a `.env` file:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `APP_PASSWORD` | Password required to access the UI | `admin` |
| `SESSION_SECRET` | Secret used to sign session cookies | `s3browser-dev-secret` |
| `PORT` | The internal port the app listens on | `3000` |

## 📖 How to Use

### 1. Adding a Provider
Click the **Settings** (⚙) icon. In the settings view, click **+ Add Provider**. You can use the **Quick Presets** for popular providers like Wasabi or Cloudflare R2 to auto-fill endpoint and region details.

### 2. Switching Providers
Use the **Provider Dropdown** in the top navigation bar to switch between your saved configurations. The bucket list will automatically refresh based on the selected provider.

### 3. Uploading Files
Simply drag files or folders anywhere onto the sidebar "Drop Zone". You can also use the **Upload Files** or **Folder** buttons to browse your local filesystem.

## 🛡 Security

- **Credential Protection**: S3 credentials are stored exclusively in the server-side session and never exposed to the client after initial configuration.
- **Auth**: Access is gated by a global application password.
- **Presigned URLs**: Object downloads use temporary signatures that expire after 5 minutes.

## 📝 License

This project is licensed under the MIT License.
