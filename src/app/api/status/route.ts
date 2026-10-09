import { provider, providerLabel } from "@/lib/llm";

export async function GET() {
  return Response.json({ ai: provider() !== "none", label: providerLabel() });
}
