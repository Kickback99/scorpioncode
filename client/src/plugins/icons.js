// 按需引入 MDI SVG 图标：只打包项目实际用到的图标，替代全量 @mdi/font 字体（约 403KB woff2 + 全量图标 CSS）
// 新增图标时，只需在下方 import 与 whitelist 各加一行；未列入的图标不会被打包
import { h } from 'vue'
import { VSvgIcon } from 'vuetify/components/VIcon'
import { aliases } from 'vuetify/iconsets/mdi-svg'
import {
  mdiAccount, mdiAccountBadge, mdiAccountCircle, mdiAccountCowboyHat, mdiAccountMusic,
  mdiAccountOffOutline, mdiAccountRemove, mdiAccountStar, mdiAlert, mdiAlertCircleOutline,
  mdiArrowRight, mdiCamera, mdiChatOutline, mdiCheckCircle, mdiChevronDown, mdiChevronRight,
  mdiChevronUp, mdiClockAlertOutline, mdiClockOutline, mdiClose, mdiComment,
  mdiCommentOutline, mdiContentSave, mdiCrownOutline, mdiDelete, mdiDeleteOutline, mdiEmail, mdiEye, mdiEyeOff,
  mdiFileDocument, mdiFileDocumentOutline, mdiGithub, mdiHeart, mdiHeartBroken, mdiHeartOutline,
  mdiHome, mdiInboxOutline, mdiInformation, mdiLinkVariantOff, mdiLockOpenOutline, mdiLockOutline,
  mdiLockReset, mdiLogin, mdiLogout, mdiMagnify, mdiMagnifyRemoveOutline, mdiMenu, mdiMenuDown,
  mdiMessageText, mdiMessageTextOutline, mdiPin, mdiQqchat, mdiRefresh, mdiReply, mdiShieldCheck,
  mdiText, mdiWeatherNight, mdiWechat, mdiWhiteBalanceSunny,
} from '@mdi/js'

// 白名单：kebab-case 图标名 → SVG path
const whitelist = {
  'mdi-account': mdiAccount,
  'mdi-account-badge': mdiAccountBadge,
  'mdi-account-circle': mdiAccountCircle,
  'mdi-account-cowboy-hat': mdiAccountCowboyHat,
  'mdi-account-music': mdiAccountMusic,
  'mdi-account-off-outline': mdiAccountOffOutline,
  'mdi-account-remove': mdiAccountRemove,
  'mdi-account-star': mdiAccountStar,
  'mdi-alert': mdiAlert,
  'mdi-alert-circle-outline': mdiAlertCircleOutline,
  'mdi-arrow-right': mdiArrowRight,
  'mdi-camera': mdiCamera,
  'mdi-chat-outline': mdiChatOutline,
  'mdi-check-circle': mdiCheckCircle,
  'mdi-chevron-down': mdiChevronDown,
  'mdi-chevron-right': mdiChevronRight,
  'mdi-chevron-up': mdiChevronUp,
  'mdi-clock-alert-outline': mdiClockAlertOutline,
  'mdi-clock-outline': mdiClockOutline,
  'mdi-close': mdiClose,
  'mdi-comment': mdiComment,
  'mdi-comment-outline': mdiCommentOutline,
  'mdi-content-save': mdiContentSave,
  'mdi-crown-outline': mdiCrownOutline,
  'mdi-delete': mdiDelete,
  'mdi-delete-outline': mdiDeleteOutline,
  'mdi-email': mdiEmail,
  'mdi-eye': mdiEye,
  'mdi-eye-off': mdiEyeOff,
  'mdi-file-document': mdiFileDocument,
  'mdi-file-document-outline': mdiFileDocumentOutline,
  'mdi-github': mdiGithub,
  'mdi-heart': mdiHeart,
  'mdi-heart-broken': mdiHeartBroken,
  'mdi-heart-outline': mdiHeartOutline,
  'mdi-home': mdiHome,
  'mdi-inbox-outline': mdiInboxOutline,
  'mdi-information': mdiInformation,
  'mdi-link-variant-off': mdiLinkVariantOff,
  'mdi-lock-open-outline': mdiLockOpenOutline,
  'mdi-lock-outline': mdiLockOutline,
  'mdi-lock-reset': mdiLockReset,
  'mdi-login': mdiLogin,
  'mdi-logout': mdiLogout,
  'mdi-magnify': mdiMagnify,
  'mdi-magnify-remove-outline': mdiMagnifyRemoveOutline,
  'mdi-menu': mdiMenu,
  'mdi-menu-down': mdiMenuDown,
  'mdi-message-text': mdiMessageText,
  'mdi-message-text-outline': mdiMessageTextOutline,
  'mdi-pin': mdiPin,
  'mdi-qqchat': mdiQqchat,
  'mdi-refresh': mdiRefresh,
  'mdi-reply': mdiReply,
  'mdi-shield-check': mdiShieldCheck,
  'mdi-text': mdiText,
  'mdi-weather-night': mdiWeatherNight,
  'mdi-wechat': mdiWechat,
  'mdi-white-balance-sunny': mdiWhiteBalanceSunny,
}

// 图标集组件：'mdi-xxx' → 查白名单；'svg:...'（Vuetify 内部别名）→ 剥离前缀
const MdiSvgIcon = (props) => {
  let path = props.icon
  if (typeof path === 'string' && path.startsWith('svg:')) {
    path = path.slice(4)
  } else if (typeof path === 'string') {
    path = whitelist[path]
  }
  return h(VSvgIcon, { ...props, icon: path })
}

export default {
  defaultSet: 'mdi',
  aliases, // Vuetify 内部组件图标（分页箭头/下拉/checkbox/评分/loading 等）
  sets: {
    mdi: { component: MdiSvgIcon },
  },
}
