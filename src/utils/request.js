const BASE_URL = import.meta.env.VITE_APP_BASE_API

let isRefreshing = false; // 刷新标记
let requestsQueue = [];   // 请求队列
// 添加队列处理函数
const addToQueue = (options, resolve, reject) => {
  requestsQueue.push({ options, resolve, reject });
};

// 处理队列中的请求
const processQueue = (token) => {
  requestsQueue.forEach(({ options, resolve }) => {
    if (options) {
      // 处理请求队列
      resolve(baseRequest(options));
    } else {
      // 处理等待token的情况
      resolve(token);
    }
  });
  requestsQueue = [];
};

// 清空请求队列
const clearQueue = () => {
  requestsQueue.forEach(({ reject }) => {
    reject(new Error('Authentication failed'));
  });
  requestsQueue = [];
};

// 导出 request 函数

export const uniLogin = () => {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: async (loginRes) => {
        try {
          const { code } = loginRes;
          const result = await uni.request({
            url: BASE_URL + '/user/login',
            method: 'POST',
            data: { code }
          });
          console.log(result.data)
          if (result.statusCode === 200 && result.data && result.data.data.token) {
            resolve(result.data.data.token);
          } else {
            reject(new Error('登录失败: 无效的响应数据'));
          }
        } catch (err) {
          reject(err);
        }
      },
      fail: reject
    });
  });
};

// 基础请求方法
const baseRequest = async (options) => {
  try {
    let token = uni.getStorageSync('token');

    // 无 Token 触发登录
    if (!token) {
      if (!isRefreshing) {
        token = await handleLoginBeforeRequest();
      } else {
        return new Promise((resolve, reject) => {
          addToQueue(options, resolve, reject);
        });
      }
    }

    return new Promise((resolve, reject) => {
      uni.request({
        url: BASE_URL + options.url,
        method: options.method || 'GET',
        header: {
          'Authorization': `Bearer ${token}`,
          ...options.header
        },
        data: options.data,
        success: (res) => {
          if (res.statusCode === 401) {
            if (!isRefreshing) {
              isRefreshing = true;
              refreshToken().then(() => {
                resolve(baseRequest(options));
              }).catch(err => {
                reject(err);
              });
            } else {
              addToQueue(options, resolve, reject);
            }
          } else {
            resolve(res.data);
          }
        },
        fail: reject
      });
    });
  } catch (err) {
    console.error('Request Error:', err);
    return Promise.reject(err);
  }
};

// Token 过期处理
const refreshToken = async () => {
  isRefreshing = true;
  try {
    const newToken = await uniLogin(); // 执行登录逻辑
    uni.setStorageSync('token', newToken);
    processQueue(newToken); // 处理队列请求
    return newToken;
  } catch (err) {
    clearQueue(); // 清空队列
    throw err;
  } finally {
    isRefreshing = false;
  }
};

// 登录前置处理
const handleLoginBeforeRequest = async () => {
  if (!isRefreshing) {
    isRefreshing = true;
    try {
      const token = await refreshToken();
      return token;
    } finally {
      isRefreshing = false;
    }
  } else {
    return new Promise((resolve, reject) => {
      // 等待刷新完成后的token
      requestsQueue.push({
        resolve: (token) => resolve(token),
        reject
      });
    });
  }
};

export const http = {
  get: (url, data) => baseRequest({ url, method: 'GET', data }),
  post: (url, data) => baseRequest({ url, method: 'POST', data }),
  put: (url, data) => baseRequest({ url, method: 'PUT', data }),
  delete: (url, data) => baseRequest({ url, method: 'DELETE', data })
};
