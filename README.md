# S3 Browser

A lightweight, web-based S3 file browser and uploader. Supports AWS S3, Wasabi, Backblaze B2, Cloudflare R2, MinIO, and other S3-compatible providers.

## Features

- **Multi-Provider Support**: Configure and save multiple S3 providers (AWS, Wasabi, MinIO, etc.) and switch between them instantly.
- **Bucket Management**: List and create buckets.
- **File Browser**: Navigate through folders, view file sizes, and modification dates.
- **Fast Uploads**: Supports multi-part uploads with concurrency limits for large files and folders.
- **Downloads**: Generate secure, time-limited presigned URLs for downloading objects.
- **Search**: Filter objects within the current directory.
- **Modern UI**: Clean, dark-themed interface with real-time upload progress tracking.

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Installation

1. Clone this repository.
2. (Optional) Create a `.env` file to customize the application password and session secret:
   ```env
   APP_PASSWORD=your_secure_password
   SESSION_SECRET=your_random_secret_string
   ```
3. Start the application:
   ```bash
   docker compose up --build -d
   ```
4. Access the browser at `http://localhost:5000`.

## Usage

### Managing Providers

1. **Sign In**: Use the password defined in your environment (default is `admin`).
2. **Settings**: Click the **Settings** (⚙) button in the top bar to manage providers.
3. **Add Provider**: 
   - Enter a friendly **Provider Name** (e.g., "My Production Wasabi").
   - Use the **Quick Presets** to automatically fill in endpoint and region settings for popular services.
   - Enter your **Access Key ID** and **Secret Access Key**.
   - Click **Connect** to verify the connection and save the configuration.
4. **Switching Providers**: Once multiple providers are configured, you can switch between them using the dropdown menu in the top navigation bar.
5. **Edit/Delete**: Select a provider from the sidebar in the Settings view to modify its details or remove it.

### Browsing and Uploading

- **Navigation**: Click on folders to navigate. Use the **Up** button to go back.
- **Upload**: Drag and drop files or entire folders into the sidebar drop zone, or use the **Upload** buttons.
- **Refresh**: Use the **Refresh** button to sync the current view with the S3 bucket.

## Security Note

This application stores your S3 credentials in your server-side session. Ensure that `SESSION_SECRET` is set to a long, random string in production to protect session data.

## License

MIT
