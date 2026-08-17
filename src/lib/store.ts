// JSONファイルストア(原子書き込み)
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const p = path.join(DATA_DIR, file);
    const raw = await fs.readFile(p, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(file: string, data: unknown): Promise<void> {
  await ensureDataDir();
  const p = path.join(DATA_DIR, file);
  const tmp = `${p}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, p);
}
