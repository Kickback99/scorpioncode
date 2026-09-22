/**
 * 密码规则唯一来源，需与后端 PasswordConstants、管理端 front/dashboard 的 utils/password.js 保持一致
 */

// 6-20 位非空白字符
export const PASSWORD_REGEX = /^\S{6,20}$/

export const PASSWORD_MESSAGE = '密码必须是 6-20位 的非空字符'
