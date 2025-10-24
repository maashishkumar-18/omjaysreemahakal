const { Storage } = require('@google-cloud/storage');

const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

const storage = new Storage({
  credentials,
  projectId: process.env.GCP_PROJECT_ID,
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

module.exports = { storage, bucket };