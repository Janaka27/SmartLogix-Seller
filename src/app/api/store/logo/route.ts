import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type || "unknown"}` },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: `${file.name} exceeds the 5MB limit` }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "smartlogix/store-logos",
      resource_type: "image",
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("Error uploading store logo to Cloudinary:", error);
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
  }
}
