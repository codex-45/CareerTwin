import { extractText, getDocumentProxy } from "unpdf";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file uploaded" }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return Response.json({ error: "File too large (max 8 MB)" }, { status: 413 });

  const buf = new Uint8Array(await file.arrayBuffer());
  try {
    if (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") {
      const pdf = await getDocumentProxy(buf);
      const { text, totalPages } = await extractText(pdf, { mergePages: false });
      return Response.json({ text: (text as string[]).join("\n"), pages: totalPages });
    }
    return Response.json({ text: new TextDecoder().decode(buf), pages: 1 });
  } catch (e) {
    return Response.json({ error: `Could not read file: ${(e as Error).message}` }, { status: 422 });
  }
}
