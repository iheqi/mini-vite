import resolve from "resolve";
import path from "path";
import { pathExists } from "fs-extra";

import { Plugin } from "../plugin";
import { ServerContext } from "../server/index";
import { DEFAULT_EXTENSIONS } from "../constants";
import { cleanUrl } from "../utils";

// 对请求的路径进行处理，使之能转换真实文件系统中的路径。如：
// ./App ==> /Users/qihe/work/learn/mini-vue/playground/src/App.tsx
// 从而让模块在 load 钩子中能够正常加载(加载逻辑在 Esbuild 语法编译插件实现)

export function resolvePlugin(): Plugin {
  let serverContext: ServerContext;
  return {
    name: "m-vite:resolve",
    configureServer(s) {
      // 保存服务端上下文
      serverContext = s;
    },
    async resolveId(id: string, importer?: string) {
      // console.log('url', id, importer);
      // 1. 绝对路径
      if (path.isAbsolute(id)) {
        if (await pathExists(id)) {
          return { id };
        }
        // 加上 root 路径前缀，处理 <script type="module" src="/src/main.tsx"></script> 的情况
        id = path.join(serverContext.root, id);
        if (await pathExists(id)) {
          return { id };
        }
      }
      // 2. 相对路径
      else if (id.startsWith(".")) {
        if (!importer) {
          throw new Error("`importer` should not be undefined");
        }
        const hasExtension = path.extname(id).length > 1;
        let resolvedId: string;
        // 2.1 包含文件名后缀
        // 如 ./App.tsx
        if (hasExtension) {
          resolvedId = resolve.sync(id, { basedir: path.dirname(importer) });
          if (await pathExists(resolvedId)) {
            return { id: resolvedId };
          }
        } 
        // 2.2 不包含文件名后缀
        // 如 ./App
        else {
          // ./App -> ./App.tsx
          for (const extname of DEFAULT_EXTENSIONS) {
            try {
              const withExtension = `${id}${extname}`;
              resolvedId = resolve.sync(withExtension, {
                basedir: path.dirname(importer),
              });
              if (await pathExists(resolvedId)) {
                return { id: resolvedId };
              }
            } catch (e) {
              continue;
            }
          }
        }
      }
      return null;
    },
  };
}