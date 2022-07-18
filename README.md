# monitor-web

A Lite SDK For XY Monitor Web
## Minimal options

```js
import { Monitor } from "xy-monitor-web";
const monitor = Monitor.init({
  // initData
});

monitor.on([event], (emitData) => {

});
monitor.on(
  ["jsError", "unhandleRejection", "resourceError","reqError"],
  (eventName, emitData) => {
    // Do report
    // ...
  }
);
/* 或者监听所有事件，不推荐 */ 
monitor.on("event", (eventName, emitData) => {
  // Do report
  // ...
});
```

## Full options

```typescript
// Default full options
export const defaultTrackerOptions = {
  env: "dev",
   // 自动上报配置，只有错误事件(jsError, unHandleRejection, resourceError, reqError, vuejsError) 生效
  report: {
    url: "",  // 上报地址
    method: "POST",
    contentType: "application/json",
    beforeSend: (data) => data  // 请求发送前报告数据，支持自定义上报数据
  },
  data: {},
  error: {
    watch: true, 
    random: 1, // 采样率从0到1, 1表示发出所有错误
    repeat: 5, // 5表示超过5次时不发出示例错误事件。请注意设置大数字，因为如果您的报告处理程序导致错误，则可能会导致 js 死循环
    delay: 1000  //延迟 1000 毫秒后发出事件
  },
  performance: false,  // 收集性能数据
  http: {
    fetch: true,  // 监听请求使用 fetch 接口
    ajax: true,// 监听请求使用 ajax 接口
    ignoreRules: [] // 请求 url 匹配规则，拦截器不会发出事件。支持字符串和正则表达式
  },
  behavior: {
    watch: false,
    console: [ConsoleType.error],
    click: true,  // 如果设置为 true 将监听所有 dom 点击事件
    queueLimit: 20 // 限制行为队列为 20 
  },
  isSpa: true // 如果 watch 为真，globalData 会在路由改变时添加 _spaUrl 属性
};
const monitor = Monitor.init(defaultTrackerOptions);
```
