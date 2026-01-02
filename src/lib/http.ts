export async function safeJson(res: Response, where: string): Promise<any> {
  const status = res.status;
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${where}: HTTP_${status}`);
  }
  if (!text || text.trim().length === 0) {
    throw new Error(`${where}: EMPTY_BODY`);
  }
  try {
    return JSON.parse(text);
  } catch (e: any) {
    throw new Error(`${where}: JSON_PARSE_FAILED:${e.message}`);
  }
}

