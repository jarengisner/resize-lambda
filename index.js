const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const { GetObjectCommand } = require('@aws-sdk/client-s3');
//comment comment
//2nd update
const sharp = require('sharp');

exports.handler = async (event) => {
  console.log('entering lambda');
  //These variables will pull the information from the original object
  const sourceBucket = event.Records[0].s3.bucket.name;
  const sourceKey = event.Records[0].s3.object.key;

  const accessKey = process.env.ACCESS_KEY;
  const secret = process.env.SECRET_ACCESS_KEY;

  // Instantiate a new S3 client.
  //set up with our user credentials
  const s3Client = new S3Client({
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secret,
    },
    region: 'us-east-1',
  });

  let params = {
    Bucket: sourceBucket,
    Key: sourceKey,
  };

  if (sourceKey.startsWith('original-image/')) {
    try {
      /* const { Body } = await s3Client
        .GetObjectCommand({ Bucket: sourceBucket, Key: sourceKey })
        .promise(); */

      const { Body } = await s3Client.send(new GetObjectCommand(params));

      const newImg = await sharp(Body)
        .resize({ width: 800, height: 600 })
        .toBuffer();

      const editedKey = sourceKey.replace('original-image/', 'edited-image/');

      const editedParams = {
        Bucket: sourceBucket,
        Key: editedKey,
        Body: newImg,
      };

      await s3Client.send(new PutObjectCommand(editedParams));

      return {
        statusCode: 200,
        body: 'Image resized and uploaded',
      };
    } catch (err) {
      console.log('Error while resizing/re-uploading:' + err);
      return {
        statusCode: 500,
        body: 'Something went wrong!',
      };
    }
  } else {
    return {
      statusCode: 200,
      body: 'No need to resize',
    };
  }
};
