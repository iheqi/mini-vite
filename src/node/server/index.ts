// connect 是一个具有中间件机制的轻量级 Node.js 框架。
// 既可以单独作为服务器，也可以接入到任何具有中间件机制的框架中，如 Koa、Express
import connect from "connect";

// picocolors 是一个用来在命令行显示不同颜色文本的工具
import { blue, green } from "picocolors";
import { optimize } from "../optimizer/index";

import { resolvePlugins } from "../plugins";
import { createPluginContainer, PluginContainer } from "../pluginContainer";
import { indexHtmlMiddleware } from "./middlewares/indexHtml";
import { transformMiddleware } from "./middlewares/transform";

export async function startDevServer() {
  const app = connect();
  const root = process.cwd();
  const startTime = Date.now();

  // 插件机制
  const plugins = resolvePlugins();
  const pluginContainer = createPluginContainer(plugins);
  
  const serverContext: ServerContext = {
    root: process.cwd(),
    app,
    pluginContainer,
    plugins,
  };
  
  // 插件流水线
  for (const plugin of plugins) {
    if (plugin.configureServer) {
      await plugin.configureServer(serverContext);
    }
  }

  // 下面两个中间件都是请求时执行的
  // 处理入口 HTML 资源
  app.use(indexHtmlMiddleware(serverContext));
  // JS/TS/JSX/TSX 编译能力
  app.use(transformMiddleware(serverContext));


  app.listen(4000, async () => {
    await optimize(root); // 服务启动时就开始预编译

    console.log(
      green("🚀 No-Bundle 服务已经成功启动!"),
      `耗时: ${Date.now() - startTime}ms`
    );
    console.log(`> 本地访问路径: ${blue("http://localhost:3000")}`);
  });
}

export interface ServerContext {
  root: string;
  pluginContainer: PluginContainer;
  app: connect.Server;
  plugins: Plugin[];
}