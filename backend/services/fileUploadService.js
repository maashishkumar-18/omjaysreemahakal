const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: process.env.GCS_KEY_FILE_PATH, // Path to your service account key file
  projectId: process.env.GCP_PROJECT_ID,
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

class FileUploadService {
  async uploadQRCode(file, userId) {
    try {
      console.log('Uploading QR code for user:', userId);
      const result = await this.uploadFile(file, 'qrcodes/', `qr-${userId}-${uuidv4()}${path.extname(file.originalname)}`);
      console.log('QR code uploaded successfully:', result);
      return result;
    } catch (error) {
      console.error('Error uploading QR code:', error);
      throw new Error('QR code upload failed: ' + error.message);
    }
  }

  async uploadPaymentScreenshot(file, paymentId) {
    try {
      console.log('Uploading payment screenshot for payment:', paymentId);
      const result = await this.uploadFile(file, 'payments/', `payment-${paymentId}-${uuidv4()}${path.extname(file.originalname)}`);
      console.log('Payment screenshot uploaded successfully:', result);
      return result;
    } catch (error) {
      console.error('Error uploading payment screenshot:', error);
      throw new Error('Payment screenshot upload failed: ' + error.message);
    }
  }

  async uploadFile(file, folder, fileName) {
    return new Promise((resolve, reject) => {
      try {
        if (!file || !file.buffer) {
          reject(new Error('No file or file buffer provided'));
          return;
        }

        const blob = bucket.file(`${folder}${fileName}`);
        const blobStream = blob.createWriteStream({
          resumable: false,
          metadata: {
            contentType: file.mimetype,
          },
        });

        blobStream.on('error', (error) => {
          console.error('Blob stream error:', error);
          reject(new Error(`File upload failed: ${error.message}`));
        });

        blobStream.on('finish', async () => {
          try {
            // Make the file publicly accessible
            await blob.makePublic();
            
            // Get the public URL
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            console.log('File uploaded to:', publicUrl);
            resolve(publicUrl);
          } catch (error) {
            console.error('Error making file public:', error);
            reject(new Error('Failed to make file public: ' + error.message));
          }
        });

        blobStream.end(file.buffer);
      } catch (error) {
        console.error('Upload file error:', error);
        reject(new Error('Upload process failed: ' + error.message));
      }
    });
  }

  async deleteFile(fileUrl) {
    try {
      // Extract filename from URL
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      console.log('Deleting file:', fileName);
      await bucket.file(fileName).delete();
      console.log('File deleted successfully:', fileName);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('File deletion failed: ' + error.message);
    }
  }

  // Helper method to generate signed URL (if needed for temporary access)
  async generateSignedUrl(fileName, expiresInMinutes = 60) {
    try {
      const options = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresInMinutes * 60 * 1000, // URL expires in specified minutes
      };

      const [url] = await bucket.file(fileName).getSignedUrl(options);
      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL: ' + error.message);
    }
  }
}

// Create and export instance
const fileUploadService = new FileUploadService();
module.exports = fileUploadService;