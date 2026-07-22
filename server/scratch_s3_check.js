require('dotenv').config();
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const s3 = new S3Client({ region: 'ap-south-1' });
async function run() {
  try {
    const data = await s3.send(new ListObjectsV2Command({
      Bucket: 'aionion-kyc-staging-documents',
      Prefix: 'stamp_papers/Stamp paper/'
    }));
    console.log('Found objects:', data.Contents ? data.Contents.length : 0);
    if(data.Contents) {
      console.log('First 5:', data.Contents.slice(0,5).map(c => c.Key));
    }
  } catch(e) { console.error(e); }
}
run();
