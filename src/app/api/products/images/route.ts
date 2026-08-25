import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || "unknown"}` },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `${file.name} exceeds the 5MB limit` },
        { status: 400 }
      );
    }
  }

  try {
    const urls = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: "smartlogix/products",
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Error uploading product images to Cloudinary:", error);
    return NextResponse.json({ error: "Failed to upload images" }, { status: 500 });
  }
}
