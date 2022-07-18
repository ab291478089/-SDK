import { TrackerEvents } from "../types/index";
import { myEmitter } from "./event";

export enum NavigationType {
  navigate = 0,//当前页面是通过点击链接，书签和表单提交，或者脚本操作，或者在url中直接输入地址
  reload = 1,//点击刷新页面按钮或者通过Location.reload()方法显示的页面
  forward = 2,//页面通过历史记录和前进后退访问时
  reserved = 255 //任何其他方式
}

export interface IPerformanceInfo<T = number> {
  dnsLkTime: T;
  tcpConTime: T;
  reqTime: T;
  domParseTime: T;
  domReadyTime: T;
  loadTime: T;
  redirectTime: T;
  blankTime: T;
  navigationType: string;
}

export class PerformanceObserver {
  private performance: Performance;

  private timingInfo: PerformanceTiming;

  constructor() {
    if (!window.performance || !window.performance.timing) {
      console.warn("Your browser does not suppport performance api.");
      return;
    }
    // 采集性能数据
    this.performance = window.performance;
    this.timingInfo = this.performance.timing;
  }

  private isDataExist(entry: any): boolean {
    return (
      entry && entry.loadEventEnd && entry.responseEnd && entry.domComplete
    );
  }

  /**
   * 异步检测performance数据是否完备
   */
  private check() {
    const entry = this.performance.getEntriesByType("navigation")[0];
    // 有可能存在第一次获取数据为0的情况
    if (this.isDataExist(entry)) {
      this.getPerformanceData();
    } else setTimeout(this.check.bind(this), 0);
  }

  private getPerformanceData() {
    const {
      domainLookupEnd,
      domainLookupStart,
      connectEnd,
      connectStart,
      responseEnd,
      requestStart,
      domComplete,
      domInteractive,
      domContentLoadedEventEnd,
      loadEventEnd,
      navigationStart,
      fetchStart,
      redirectEnd,
      redirectStart,
      domLoading,
    } = this.timingInfo;
    // dns查询耗时
    const dnsLkTime = domainLookupEnd - domainLookupStart;
    // tcp连接耗时
    const tcpConTime = connectEnd - connectStart;
    // 请求时间
    const reqTime = responseEnd - requestStart;
    // 加载内嵌资源耗时  domComplete => dom树由readyState 变为 complete ; domInteractive =>开始加载内嵌资源时间 readyState属性变为“interactive”
    const domParseTime = domComplete - domInteractive;
    //domReadyTime
    const domReadyTime = domContentLoadedEventEnd - fetchStart;
    // 加载耗时
    const loadTime = loadEventEnd - navigationStart;
    //重定向时间
    const redirectTime = redirectEnd - redirectStart;
    //白屏时间
    const blankTime = domLoading - fetchStart;
    //统计如何导航到这个页面的
    const navigationType = NavigationType[this.performance.navigation.type];

    const performanceInfo: IPerformanceInfo = {
      dnsLkTime,
      tcpConTime,
      reqTime,
      domParseTime,
      domReadyTime,
      loadTime,
      redirectTime,
      blankTime,
      navigationType
    };

    myEmitter.customEmit(TrackerEvents.performanceInfoReady, performanceInfo);
  }

  init(): void {
    this.check();
  }
}
