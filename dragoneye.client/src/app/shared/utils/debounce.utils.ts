// Debounce utilities

export class DebounceUtils {
  
  /**
   * Debounce a function call
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate: boolean = false
  ): (...args: Parameters<T>) => void {
    let timeout: number | null = null;
    
    return function(this: any, ...args: Parameters<T>) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      
      const callNow = immediate && !timeout;
      
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = window.setTimeout(later, wait);
      
      if (callNow) {
        func.apply(this, args);
      }
    };
  }

  /**
   * Throttle a function call
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;
    
    return function(this: any, ...args: Parameters<T>) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Create a debounced version that can be cancelled
   */
  static cancellableDebounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate: boolean = false
  ): {
    (...args: Parameters<T>): void;
    cancel(): void;
    flush(): void;
  } {
    let timeout: number | null = null;
    let args: Parameters<T> | null = null;
    let context: any = null;
    
    const debounced = function(this: any, ...newArgs: Parameters<T>) {
      context = this;
      args = newArgs;
      
      const later = () => {
        timeout = null;
        if (!immediate && args) func.apply(context, args);
      };
      
      const callNow = immediate && !timeout;
      
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = window.setTimeout(later, wait);
      
      if (callNow && args) {
        func.apply(context, args);
      }
    };
    
    debounced.cancel = () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      args = null;
      context = null;
    };
    
    debounced.flush = () => {
      if (timeout && args) {
        func.apply(context, args);
        debounced.cancel();
      }
    };
    
    return debounced;
  }

  /**
   * Debounce with leading and trailing options
   */
  static advancedDebounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options: {
      leading?: boolean;
      trailing?: boolean;
      maxWait?: number;
    } = {}
  ): (...args: Parameters<T>) => void {
    let lastCallTime: number | undefined;
    let lastInvokeTime: number = 0;
    let timerId: number | undefined;
    let lastArgs: Parameters<T> | undefined;
    let lastThis: any;
    let result: ReturnType<T>;
    
    const { leading = false, trailing = true, maxWait } = options;
    const useTrailing = trailing;
    
    function invokeFunc(time: number) {
      const args = lastArgs!;
      const thisArg = lastThis;
      
      lastArgs = lastThis = undefined;
      lastInvokeTime = time;
      result = func.apply(thisArg, args);
      return result;
    }
    
    function leadingEdge(time: number) {
      lastInvokeTime = time;
      timerId = window.setTimeout(timerExpired, wait);
      return leading ? invokeFunc(time) : result;
    }
    
    function remainingWait(time: number) {
      const timeSinceLastCall = time - (lastCallTime || 0);
      const timeSinceLastInvoke = time - lastInvokeTime;
      const timeWaiting = wait - timeSinceLastCall;
      
      return maxWait !== undefined
        ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
        : timeWaiting;
    }
    
    function shouldInvoke(time: number) {
      const timeSinceLastCall = time - (lastCallTime || 0);
      const timeSinceLastInvoke = time - lastInvokeTime;
      
      return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
              (timeSinceLastCall < 0) || (maxWait !== undefined && timeSinceLastInvoke >= maxWait));
    }
    
    function timerExpired() {
      const time = Date.now();
      if (shouldInvoke(time)) {
        return trailingEdge(time);
      }
      timerId = window.setTimeout(timerExpired, remainingWait(time));
    }
    
    function trailingEdge(time: number) {
      timerId = undefined;
      
      if (useTrailing && lastArgs) {
        return invokeFunc(time);
      }
      lastArgs = lastThis = undefined;
      return result;
    }
    
    function cancel() {
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
      lastInvokeTime = 0;
      lastArgs = lastCallTime = lastThis = timerId = undefined;
    }
    
    function flush() {
      return timerId === undefined ? result : trailingEdge(Date.now());
    }
    
    function debounced(this: any, ...args: Parameters<T>) {
      const time = Date.now();
      const isInvoking = shouldInvoke(time);
      
      lastArgs = args;
      lastThis = this;
      lastCallTime = time;
      
      if (isInvoking) {
        if (timerId === undefined) {
          return leadingEdge(lastCallTime);
        }
        if (maxWait) {
          timerId = window.setTimeout(timerExpired, wait);
          return invokeFunc(lastCallTime);
        }
      }
      if (timerId === undefined) {
        timerId = window.setTimeout(timerExpired, wait);
      }
      return result;
    }
    
    return debounced;
  }

  /**
   * Create a rate limiter that ensures function is called at most once per interval
   */
  static rateLimit<T extends (...args: any[]) => any>(
    func: T,
    interval: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let lastCall = 0;
    let pending: Promise<ReturnType<T>> | null = null;
    
    return async function(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall;
      
      if (timeSinceLastCall >= interval) {
        lastCall = now;
        return func.apply(this, args);
      }
      
      if (!pending) {
        const waitTime = interval - timeSinceLastCall;
        pending = new Promise(resolve => {
          setTimeout(() => {
            lastCall = Date.now();
            pending = null;
            resolve(func.apply(this, args));
          }, waitTime);
        });
      }
      
      return pending;
    };
  }

  /**
   * Batch function calls and execute them together
   */
  static batch<T extends (...args: any[]) => any>(
    func: T,
    batchSize: number,
    delay: number = 0
  ): (...args: Parameters<T>) => Promise<ReturnType<T>[]> {
    let batch: { args: Parameters<T>; resolve: (value: ReturnType<T>) => void }[] = [];
    let timeout: number | null = null;
    
    const executeBatch = () => {
      if (batch.length === 0) return;
      
      const currentBatch = batch.splice(0, batchSize);
      const results = currentBatch.map(({ args }) => func(...args));
      
      currentBatch.forEach(({ resolve }, index) => {
        resolve(results[index]);
      });
      
      if (batch.length > 0) {
        timeout = window.setTimeout(executeBatch, delay);
      } else {
        timeout = null;
      }
    };
    
    return function(...args: Parameters<T>): Promise<ReturnType<T>> {
      return new Promise(resolve => {
        batch.push({ args, resolve });
        
        if (batch.length >= batchSize) {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          executeBatch();
        } else if (!timeout && delay > 0) {
          timeout = window.setTimeout(executeBatch, delay);
        } else if (delay === 0) {
          setTimeout(executeBatch, 0);
        }
      });
    };
  }

  /**
   * Retry a function with exponential backoff
   */
  static retry<T>(
    func: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    backoffFactor: number = 2
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let retries = 0;
      
      const attempt = () => {
        func()
          .then(resolve)
          .catch(error => {
            if (retries >= maxRetries) {
              reject(error);
              return;
            }
            
            retries++;
            const delay = baseDelay * Math.pow(backoffFactor, retries - 1);
            setTimeout(attempt, delay);
          });
      };
      
      attempt();
    });
  }
}
