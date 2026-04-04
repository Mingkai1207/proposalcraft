// AWS S3 storage helpers
// Uses @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

function getS3Client(): S3Client {
  if (!ENV.awsAccessKeyId || !ENV.awsSecretAccessKey || !ENV.awsBucket) {
    throw new Error(
      "AWS S3 credentials missing: set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET"
    );
  }

  return new S3Client({
    region: ENV.awsRegion || "us-east-1",
    credentials: {
      accessKeyId: ENV.awsAccessKeyId,
      secretAccessKey: ENV.awsSecretAccessKey,
    },
  });
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const client = getS3Client();
  const key = normalizeKey(relKey);

  const body =
    typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);

  await client.send(
    new PutObjectCommand({
      Bucket: ENV.awsBucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  // Return a presigned GET URL valid for 7 days
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: ENV.awsBucket, Key: key }),
    { expiresIn: 60 * 60 * 24 * 7 }
  );

  return { key, url };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const client = getS3Client();
  const key = normalizeKey(relKey);

  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: ENV.awsBucket, Key: key }),
    { expiresIn: 60 * 60 * 24 * 7 }
  );

  return { key, url };
}

export async function storageDelete(relKey: string): Promise<void> {
  const client = getS3Client();
  const key = normalizeKey(relKey);

  await client.send(
    new DeleteObjectCommand({ Bucket: ENV.awsBucket, Key: key })
  );
}
