
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

async function listObjects() {
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://f75cb92cd12b811e54e297f9a5aee814.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: '09cbe466fd22a36816823e24c69b3848',
      secretAccessKey: '34deda2720ed65bfaad4288f9885faaa4da4d5f113dd03e44afd3edd576e85bf',
    },
  });

  try {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: 'pnl',
        MaxKeys: 20,
        Prefix: 'images/news/'
      })
    );
    console.log('Objects:', res.Contents ? res.Contents.map(c => c.Key) : 'No contents');
  } catch (err) {
    console.error('List Error:', err);
  }
}

listObjects();
