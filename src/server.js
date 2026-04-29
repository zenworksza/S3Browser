'use strict';
const express = require('express');
const session = require('express-session');
const busboy = require('busboy');
const path = require('path');
const crypto = require('crypto');
const { S3Client, ListBucketsCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, CreateBucketCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
const PORT = process.env.PORT || 3000;
// Use a fixed fallback secret so sessions survive container restarts in dev
const SESSION_SECRET = process.env.SESSION_SECRET || 's3browser-dev-secret-change-in-production';
const APP_PASSWORD = process.env.APP_PASSWORD || 'admin';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: true,           // always resave so mutations are not lost
  saveUninitialized: false,
  cookie: { maxAge: 86400000 }
}));
app.use(express.static(path.join(__dirname, '../public')));

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

function getS3Client(req) {
  const cfg = req.session.s3config || {};
  const { endpoint, accessKey, secretKey, region, forcePathStyle } = cfg;
  if (!accessKey || !secretKey) throw new Error('No S3 credentials configured');
  return new S3Client({
    endpoint: endpoint || undefined,
    region: region || 'us-east-1',
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: forcePathStyle || false,
  });
}

// Auth
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === APP_PASSWORD) {
    req.session.authenticated = true;
    req.session.save(err => {
      if (err) return res.status(500).json({ error: 'Session error' });
      res.json({ ok: true });
    });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  res.json({
    authenticated: !!(req.session && req.session.authenticated),
    hasConfig: !!(req.session && req.session.s3config),
    config: req.session.s3config ? {
      endpoint: req.session.s3config.endpoint,
      region: req.session.s3config.region,
      forcePathStyle: req.session.s3config.forcePathStyle,
    } : null
  });
});

// S3 Config
app.post('/api/config', requireAuth, async (req, res) => {
  const { endpoint, accessKey, secretKey, region, forcePathStyle } = req.body;
  if (!accessKey || !secretKey) return res.status(400).json({ error: 'Access key and secret key are required' });

  const cfg = {
    endpoint: (endpoint || '').trim(),
    accessKey: accessKey.trim(),
    secretKey: secretKey.trim(),
    region: (region || 'us-east-1').trim(),
    forcePathStyle: !!forcePathStyle
  };

  // Test the connection before saving
  const testClient = new S3Client({
    endpoint: cfg.endpoint || undefined,
    region: cfg.region,
    credentials: { accessKeyId: cfg.accessKey, secretAccessKey: cfg.secretKey },
    forcePathStyle: cfg.forcePathStyle,
  });

  try {
    await testClient.send(new ListBucketsCommand({}));
  } catch (err) {
    return res.status(400).json({ error: 'Connection failed: ' + (err.message || 'Unknown error') });
  }

  // Connection succeeded — save config to session
  req.session.s3config = cfg;
  req.session.save(err => {
    if (err) return res.status(500).json({ error: 'Failed to save session' });
    res.json({ ok: true });
  });
});

app.delete('/api/config', requireAuth, (req, res) => {
  req.session.s3config = null;
  req.session.save(() => res.json({ ok: true }));
});

// Buckets
app.get('/api/buckets', requireAuth, async (req, res) => {
  try {
    const client = getS3Client(req);
    const data = await client.send(new ListBucketsCommand({}));
    res.json({ buckets: (data.Buckets || []).map(b => ({ name: b.Name, created: b.CreationDate })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create bucket
app.post('/api/buckets', requireAuth, async (req, res) => {
  try {
    const client = getS3Client(req);
    const { name, region } = req.body;
    if (!name) return res.status(400).json({ error: 'Bucket name is required' });
    const bucketRegion = region || req.session.s3config.region || 'us-east-1';
    const params = { Bucket: name };
    if (bucketRegion && bucketRegion !== 'us-east-1') {
      params.CreateBucketConfiguration = { LocationConstraint: bucketRegion };
    }
    await client.send(new CreateBucketCommand(params));
    res.json({ ok: true, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Objects
app.get('/api/buckets/:bucket/objects', requireAuth, async (req, res) => {
  try {
    const client = getS3Client(req);
    const { bucket } = req.params;
    const prefix = req.query.prefix || '';
    const allObjects = [];
    let continuationToken;
    do {
      const cmd = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, Delimiter: '/', ContinuationToken: continuationToken });
      const data = await client.send(cmd);
      (data.CommonPrefixes || []).forEach(p => allObjects.push({ key: p.Prefix, type: 'folder', name: p.Prefix.slice(prefix.length) }));
      (data.Contents || []).forEach(o => {
        if (o.Key === prefix) return;
        allObjects.push({ key: o.Key, type: 'file', name: o.Key.slice(prefix.length), size: o.Size, modified: o.LastModified });
      });
      continuationToken = data.NextContinuationToken;
    } while (continuationToken);
    res.json({ objects: allObjects, prefix });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete object
app.delete('/api/buckets/:bucket/objects', requireAuth, async (req, res) => {
  try {
    const client = getS3Client(req);
    const { bucket } = req.params;
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'Key required' });
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download via presigned URL
app.get('/api/buckets/:bucket/download', requireAuth, async (req, res) => {
  try {
    const client = getS3Client(req);
    const { bucket } = req.params;
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'Key required' });
    const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 300 });
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload — relativePath and prefix come as query params, one file per request
app.post('/api/buckets/:bucket/upload', requireAuth, (req, res) => {
  const { bucket } = req.params;
  const prefix = req.query.prefix || '';
  const relativePath = req.query.relativePath || '';
  let client;
  try { client = getS3Client(req); } catch (e) { return res.status(400).json({ error: e.message }); }

  const bb = busboy({ headers: req.headers, limits: { fileSize: 5 * 1024 * 1024 * 1024 } });
  let settled = false;

  bb.on('file', (fieldname, fileStream, info) => {
    const filename = relativePath || info.filename || fieldname;
    const key = prefix + filename;
    const upload = new Upload({
      client,
      params: { Bucket: bucket, Key: key, Body: fileStream },
      queueSize: 4,
      partSize: 10 * 1024 * 1024,
    });
    upload.done()
      .then(() => {
        if (!settled) { settled = true; res.json({ ok: true, key, name: filename }); }
      })
      .catch(err => {
        if (!settled) { settled = true; res.status(500).json({ error: err.message }); }
      });
  });

  bb.on('error', err => {
    if (!settled) { settled = true; res.status(500).json({ error: err.message }); }
  });

  req.pipe(bb);
});

app.listen(PORT, () => console.log(`S3 Browser running on http://0.0.0.0:${PORT}`));
