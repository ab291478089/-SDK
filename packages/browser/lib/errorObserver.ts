import { ITrackerOptions } from "./monitor";
import { TrackerEvents, BaseError, ErrorType } from "../types/index";
import { myEmitter } from "./event";
import ErrorStackParser from "error-stack-parser";
import stringify from "json-stringify-safe";
import {
  BaseObserver,
  IError,
  IUnHandleRejectionError
} from "./baseErrorObserver";

export class ErrorObserver extends BaseObserver {
  constructor(options: ITrackerOptions) {
    super(options);
    this._options = options;
  }

  init(): void {
    const self = this;
    const oldOnError = window.onerror;
    const oldUnHandleRejection = window.onunhandledrejection;
    
    //捕获js运行时错误,window会触发error事件
    window.onerror = function (...args) {
      if (oldOnError) {
        oldOnError(...args);
      }

      const [msg, url, line, column, error] = args;

      const stackTrace = error ? ErrorStackParser.parse(error) : [];
      const msgText = typeof msg === "string" ? msg : msg.type;
      const errorObj: IError = {
        msg: msgText,
        url,
        line,
        column,
        stackTrace: stringify(stackTrace),
        errorType: ErrorType.jsError,
        context: this
      };

      self.safeEmitError(msgText, TrackerEvents.jsError, errorObj);
    };

    //当Promise 被 reject 且没有 reject 处理器的时候，会触发 unhandledrejection 事件；
    window.onunhandledrejection = function (e: PromiseRejectionEvent) {
      if (oldUnHandleRejection) {
        oldUnHandleRejection.call(window, e);
      }

      const error = e.reason;
      const errMsg = error instanceof Error ? error.message : error;

      const errorObj: IUnHandleRejectionError = {
        msg: errMsg,
        errorType: ErrorType.unHandleRejectionError,
        context: this
      };

      self.safeEmitError(errMsg, TrackerEvents.unHandleRejection, errorObj);
    };

    // 监听资源加载错误 404 并 采集资源地址
    window.addEventListener(
      "error",
      function (event) {
        const target: any = event.target || event.srcElement;
        const isElementTarget =
          target instanceof HTMLScriptElement ||
          target instanceof HTMLLinkElement ||
          target instanceof HTMLImageElement;
        if (!isElementTarget) return false;

        let url: string;
        if (target instanceof HTMLLinkElement) {
          url = target.href;
        } else {
          url = target.src;
        }

        const errorType = ErrorType.resourceError;
        const errorObj: BaseError = {
          url,
          errorType: errorType,
          context: this
        };

        self.safeEmitError(
          `${errorType}: ${url}`,
          TrackerEvents.resourceError,
          errorObj
        );

        myEmitter.emitWithGlobalData(TrackerEvents.resourceError, errorObj);
      },
      true
    );
  }
}
