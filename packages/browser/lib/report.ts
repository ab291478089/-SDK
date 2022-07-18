import { serialize } from "object-to-formdata";
import stringify from "json-stringify-safe";
import { ITrackerOptions } from "./monitor";
import { ErrorCombine } from "./monitor";
import { convertObjToUrlencoded, isObject,formatParams } from "./util";

export type ErrorList = Array<ErrorCombine>;

export interface IReportParams {
  errorList: ErrorList;
}

export type ReportData = string | FormData;

export class Reporter {
  private _options: ITrackerOptions;

  constructor(options: ITrackerOptions) {
    this._options = options;
  }

  private _isMatchMethod(input: string, method = "get") {
    return input.toLowerCase() === method;
  }

  private getPureReportData(error: { [key: string]: any }) {
    Reflect.deleteProperty(error, "context");

    Object.keys(error).forEach((key) => {
      const val = error[key];

      if (isObject(val)) {
        error[key] = stringify(val);
      }
    });

    return error;
  }

  // ajax请求上报
  xmlLoadData(reportData: ReportData): void {
    const { method, contentType } = this._options.report;
    let { url } = this._options.report;
    const isHttpGet = this._isMatchMethod(method, "get");

    if (isHttpGet) {
      url += `?${reportData}`;
    }

    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-type", contentType);
    xhr.send(reportData);
  }

  // 动态创建img标签上报
  imgReport(reportData: ReportData): void {
    let { url } = this._options.report;
    let image = document.createElement("img");
    image.onload = image.onerror = function () {
    };
    let newUrl = `${url}?${reportData}`;
    image.src = newUrl;
  }

  // sendBeacon方法在页面销毁期，可以异步的发送数据，因此不会造成类似同步ajax请求那样的阻塞问题,也不会影响下一个页面的渲染
  sendBeacon(reportData: ReportData) {
    let { url } = this._options.report;
    //判断支不支持navigator.sendBeacon
    try {
      if (
        navigator.sendBeacon &&
        navigator.sendBeacon(url, reportData)
      ) {
        return;
      }
    } catch (e) {}
    // 不支持 sendBeacon 或发送失败时，使用 xhr 兜底
    this.xmlLoadData(reportData);
  }

  reportError(error: ErrorCombine) {
    const { contentType, method, beforeSend, url } = this._options.report;

    if (typeof beforeSend === "function") {
      const handledError = beforeSend.call(this, error, error.errorType);

      if (isObject(handledError)) {
        error = handledError;
      } else {
        console.warn(
          `If you want to overite report data, please return object in [beforeSend] hook`
        );
      }
    }

    const pureData = this.getPureReportData(error);
    const isHttpGet = this._isMatchMethod(method, "get");

    let reportData: ReportData;

    if (isHttpGet || contentType === "application/x-www-form-urlencoded") {
      reportData = convertObjToUrlencoded(pureData);
    } else if (contentType === "application/form-data") {
      reportData = serialize(pureData);
    } else {
      reportData = stringify(pureData);
    }
    let urlLength = (url + (url.indexOf("?") < 0 ? "?" : "&") + reportData).length;
    // 判断是否超过浏览器限制最大长度
    if (urlLength < 1000) {
      this.imgReport(reportData);
    } else {
      this.sendBeacon(reportData);
    }
  }

  reportErrors(errorList: ErrorList): void {
    if (!errorList.length) return;

    for (const error of errorList) {
      setTimeout(() => {
        this.reportError(error);
      }, 0);
    }
  }
}
