import { IErrorOptions, ITrackerOptions } from "./monitor";
import { BaseError } from "../types/index";
import { myEmitter } from "./event";
import { replaceSlash } from "./util";

export interface IError extends BaseError {
  msg: string | Event;
  line: number | undefined;
  column: number | undefined;
  stackTrace: string;
}

export interface IUnHandleRejectionError extends BaseError {
  msg: string;
}

export interface ICacheError {
  [errorMsg: string]: number;
}

export class BaseObserver {
  public _options;
  private _cacheError: ICacheError;

  constructor(options: ITrackerOptions) {
    this._cacheError = {};
    this._options = options;
  }

  /**
   * 不能多次发出相同的错误, 为了阻止死循环
   */
  safeEmitError(
    cacheKey: string,
    errorType: string,
    errorObj: IError | BaseError | IUnHandleRejectionError
  ) {
    if (typeof this._cacheError[cacheKey] !== "number") {
      this._cacheError[cacheKey] = 0;
    } else {
      this._cacheError[cacheKey] += 1;
    }

    const repeat = (this._options.error as IErrorOptions).repeat;
    if (this._cacheError[cacheKey] < repeat) {
      myEmitter.emitWithGlobalData(errorType, errorObj);
    } else {
      console.warn(
        "The error has reached the preset number of repetitions",
        errorObj
      );
    }
  }

  /**
   * 检查请求url是否匹配忽略规则
   */
  isUrlInIgnoreList(url: string): boolean {
    const ignoreList = this._options.http.ignoreRules;
    const reportUrl = this._options.report.url;

    // 如果 reportUrl 也设置了, 需要增加的规则组里
    if (reportUrl) {
      ignoreList.push(reportUrl);
    }

    return ignoreList.some((urlItem) => {
      if (typeof urlItem === "string") {
        return replaceSlash(urlItem) === replaceSlash(url);
      } else {
        return urlItem.test(url);
      }
    });
  }
}
