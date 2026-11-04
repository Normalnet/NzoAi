import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const BUCKET_NAME = process.env.NEON_OBJECT_STORAGE_BUCKET || "assets";

export function getStorageClient(): S3Client | null {
  if (!process.env.AWS_ENDPOINT_URL_S3 || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return null;
  }
  return new S3Client({
    forcePathStyle: true, // required: Neon uses path-style addressing
    region: process.env.AWS_REGION || "eu-central-1",
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

export async function uploadToStorage(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string> {
  const client = getStorageClient();
  if (!client) {
    throw new Error("Neon Object Storage is not configured");
  }
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return getSignedUrl(client, new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }), { expiresIn: 3600 * 24 });
}
