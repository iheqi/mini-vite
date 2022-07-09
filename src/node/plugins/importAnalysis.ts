import { init, parse } from "es-module-lexer";
import MagicString from "magic-string";
import path from "path";
import { pathExists } from "fs-extra";
import resolve from "resolve";

import {
  BARE_IMPORT_RE,
  DEFAULT_EXTENSIONS,
  PRE_BUNDLE_DIR,
} from "../constants";
import {
  cleanUrl,
  isJSRequest,
} from "../utils";
// magic-string 用来作字符串编辑

import { Plugin } from "../plugin";
import { ServerContext } from "../server/index";


export function importAnalysisPlugin(): Plugin {
  let serverContext: ServerContext;
  return {
    name: "m-vite:import-analysis",
    configureServer(s) {
      // 保存服务端上下文
      serverContext = s;
    },
    async transform(code: string, id: string) {
      // 只处理 JS 相关的请求
      if (!isJSRequest(id)) {
        return null;
      }
      await init;
      // 解析 import 语句
      const [imports] = parse(code);
      const ms = new MagicString(code);

      const { moduleGraph } = serverContext;
      const curModule = moduleGraph.getModuleById(id)!;
      const importedModules = new Set<string>();

      // 对每一个 import 语句依次进行分析
      for (const importInfo of imports) {
        // 举例说明: const str = `import React from 'react'`
        // str.slice(s, e) => 'react'
        const { s: modStart, e: modEnd, n: modSource } = importInfo;
        if (!modSource) continue;
        // console.log('importInfo', importInfo);

        // 静态资源
        if (modSource.endsWith(".svg")) {
          // 加上 ?import 后缀
          const resolvedUrl = path.join(path.dirname(id), modSource);
          // console.log('resolvedUrl', resolvedUrl, id, modSource);
          ms.overwrite(modStart, modEnd, `${resolvedUrl}?import`);
          continue;
        }  

        // 对于第三方依赖路径(bare import)，需要重写为预构建产物的路径；
        // 对于绝对路径和相对路径，需要借助之前的路径解析插件进行解析。

        // 第三方库: 路径重写到预构建产物的路径
        if (BARE_IMPORT_RE.test(modSource)) {
          const bundlePath = path.join(
            serverContext.root,
            PRE_BUNDLE_DIR,
            `${modSource}.js`
          );
          ms.overwrite(modStart, modEnd, bundlePath);
          // console.log('bundlePath', bundlePath);
          importedModules.add(bundlePath);
        }
        else if (modSource.startsWith(".") || modSource.startsWith("/")) {
          // 直接调用插件上下文的 resolve 方法，会自动经过路径解析插件的处理
          const resolved = await this.resolve(modSource, id);
          if (resolved) {
            ms.overwrite(modStart, modEnd, resolved.id);
            // importedModules.add(resolved);
            importedModules.add(resolved.id);
            // console.log('resolved.id', resolved.id);
          }
        }
      }

      moduleGraph.updateModuleInfo(curModule, importedModules);

      return {
        code: ms.toString(),
        // 生成 SourceMap
        map: ms.generateMap(),
      };
    },
  };
}