// 定义需要携带 token 的路径列表（即"需要登录认证的接口"）
// 与后端 ClientSecurityConfig 的 matchers 对齐（子路径接口用尾部斜杠做前缀匹配）
export const AUTH_REQUIRED_PATHS = [
  '/test',
  '/user/userDetailInfo',
  '/user/logout',
  '/user/updateUserDetailInfo',
  '/user/cancel',
  '/user/changePassword',
  '/user/favorites/',         // GET 收藏列表 + DELETE 取消收藏（带子路径）
  '/user/favorite/toggle/',   // POST 切换收藏
  '/user/comments/',          // GET 我的评论列表
  '/user/userComment/',       // DELETE 删除评论
  '/user/msg/comment/reply',  // POST 发表评论/回复
  '/user/msg/comment/byId/',  // DELETE 按 id 删评论

  // 订单相关
  /* '/order/',
  '/payment/', */
  // 购物车相关
  // '/cart/',
  // 用户信息相关（除了登录注册）
  /* '/user/profile',
  '/user/update' */
];

// 导出匹配函数
export const isAuthRequired = (url) => {
  return AUTH_REQUIRED_PATHS.some(path => {
    // 如果路径以 '/' 结尾，说明是前缀匹配
    if (path.endsWith('/')) {
      return url.startsWith(path);
    }
    // 否则精确匹配
    return url === path || url.includes(path);
  });
};
