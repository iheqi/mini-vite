import { JS_TYPES_RE, HASH_RE, QUERY_RE } from './constants.ts'
import path from "path";

export const isJSRequest = (id: string): boolean => {
  id = cleanUrl(id);
  if (JS_TYPES_RE.test(id)) {
    return true;
  }
  if (!path.extname(id) && !id.endsWith("/")) { // path.extname返回文件扩展名
    return true;
  }
  return false;
};

export const isCSSRequest = (id: string): boolean => cleanUrl(id).endsWith(".css");
export function isImportRequest(url: string): boolean {
  return url.endsWith("?import");
}

export const cleanUrl = (url: string): string => url.replace(HASH_RE, "").replace(QUERY_RE, "");

export function removeImportQuery(url: string): string {
  return url.replace(/\?import$/, "");
}
