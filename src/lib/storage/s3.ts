import { createHash, createHmac } from "crypto";

type UploadObjectInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hashHex(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

function signingKey(input: {
  secretAccessKey: string;
  dateStamp: string;
  region: string;
}) {
  const dateKey = hmac(`AWS4${input.secretAccessKey}`, input.dateStamp);
  const regionKey = hmac(dateKey, input.region);
  const serviceKey = hmac(regionKey, "s3");

  return hmac(serviceKey, "aws4_request");
}

function amzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function encodedPath(key: string) {
  return `/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function cloudFrontUrlForKey(key: string) {
  const domain = requiredEnv("AWS_CLOUDFRONT_DOMAIN").replace(/^https?:\/\//, "");

  return `https://${domain}/${key}`;
}

export async function uploadObjectToS3(input: UploadObjectInput) {
  const accessKeyId = requiredEnv("AWS_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnv("AWS_SECRET_ACCESS_KEY");
  const region = requiredEnv("AWS_REGION");
  const bucket = requiredEnv("AWS_S3_BUCKET");
  const now = new Date();
  const requestDate = amzDate(now);
  const dateStamp = requestDate.slice(0, 8);
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const canonicalUri = encodedPath(input.key);
  const payloadHash = hashHex(input.body);
  const canonicalHeaders = [
    `content-type:${input.contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${requestDate}`,
  ].join("\n");
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    requestDate,
    credentialScope,
    hashHex(canonicalRequest),
  ].join("\n");
  const signature = createHmac(
    "sha256",
    signingKey({ secretAccessKey, dateStamp, region }),
  )
    .update(stringToSign)
    .digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const uploadBody = input.body.buffer.slice(
    input.body.byteOffset,
    input.body.byteOffset + input.body.byteLength,
  ) as ArrayBuffer;
  const response = await fetch(`https://${host}${canonicalUri}`, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Content-Type": input.contentType,
      "X-Amz-Content-Sha256": payloadHash,
      "X-Amz-Date": requestDate,
    },
    body: uploadBody,
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed with status ${response.status}.`);
  }

  return {
    s3_key: input.key,
    file_url: cloudFrontUrlForKey(input.key),
  };
}
