import path from "path";

import { 
  JS_TYPES_RE, 
  HASH_RE, 
  QUERY_RE, 
  CLIENT_PUBLIC_PATH 
} from './constants.ts';

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

export function getShortName(file: string, root: string) {
  return file.startsWith(root + "/") ? path.posix.relative(root, file) : file;
}

const INTERNAL_LIST = [CLIENT_PUBLIC_PATH, "/@react-refresh"];

export function isInternalRequest(url: string): boolean {
  return INTERNAL_LIST.includes(url);
}