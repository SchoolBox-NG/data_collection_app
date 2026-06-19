import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/apiGuards";
import { createContentRecord } from "@/lib/models/contentRecord";
import { parseBulkContentFile } from "@/lib/content/parseBulk";
import { type ContentImportInput, type ImportResult, type MathItem } from "@/lib/content/types";

export const runtime = "nodejs";

type JsonImportBody =
  | {
      mode?: "single";
      record?: Partial<ContentImportInput>;
      mathItems?: MathItem[];
    }
  | {
      mode?: "bulk";
      records?: Partial<ContentImportInput>[];
    };

async function createMany(input: {
  records: Partial<ContentImportInput>[];
  createdBy: NonNullable<Awaited<ReturnType<typeof requireApiRole>>["user"]>;
}) {
  const result: ImportResult = {
    created: [],
    errors: [],
  };

  for (const [index, record] of input.records.entries()) {
    try {
      const created = await createContentRecord({
        record,
        createdBy: input.createdBy,
      });
      result.created.push(created);
    } catch (error) {
      result.errors.push({
        row: index + 2,
        message: error instanceof Error ? error.message : "Could not import row.",
      });
    }
  }

  return result;
}

async function handleJsonImport(request: NextRequest) {
  const auth = await requireApiRole(["content_admin"]);

  if (auth.response) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as JsonImportBody | null;

  if (!body) {
    return NextResponse.json({ error: "Import body is required." }, { status: 400 });
  }

  if ("records" in body && Array.isArray(body.records)) {
    const result = await createMany({
      records: body.records,
      createdBy: auth.user,
    });

    return NextResponse.json(result, { status: result.errors.length ? 207 : 201 });
  }

  if (!("record" in body) || !body.record) {
    return NextResponse.json({ error: "Content record is required." }, { status: 400 });
  }

  try {
    const created = await createContentRecord({
      record: body.record,
      mathItems: "mathItems" in body ? body.mathItems : undefined,
      createdBy: auth.user,
    });

    return NextResponse.json({ created: [created], errors: [] }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        created: [],
        errors: [
          {
            row: 1,
            message: error instanceof Error ? error.message : "Could not import record.",
          },
        ],
      },
      { status: 400 },
    );
  }
}

async function handleFileImport(request: NextRequest) {
  const auth = await requireApiRole(["content_admin"]);

  if (auth.response) {
    return auth.response;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload file is required." }, { status: 400 });
  }

  try {
    const records = await parseBulkContentFile(file);
    const result = await createMany({
      records,
      createdBy: auth.user,
    });

    return NextResponse.json(result, { status: result.errors.length ? 207 : 201 });
  } catch (error) {
    return NextResponse.json(
      {
        created: [],
        errors: [
          {
            row: 1,
            message: error instanceof Error ? error.message : "Could not import file.",
          },
        ],
      },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return handleFileImport(request);
  }

  return handleJsonImport(request);
}
