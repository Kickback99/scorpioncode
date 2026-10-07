// 按需引入白名单图标（与 elIcons.json 保持同步），避免全量打包 @element-plus/icons-vue
import {
  User,
  Lock,
  Edit,
  Close,
  Search,
  Refresh,
  FullScreen,
  Delete,
  Remove,
  Plus,
  WarnTriangleFilled,
  Check,
  EditPen,
  SwitchButton,
  Baseball,
  Upload,
  Download,
  CopyDocument,
  CircleCheck,
  MoreFilled,
  Expand,
  Top,
  Fold,
  Right,
  Bottom,
  ArrowLeft,
  ArrowDown,
  ArrowRight,
  CircleClose,
  Sunny,
  Moon,
  Setting,
  QuestionFilled,
  UserFilled,
  Iphone,
  Message,
  Comment
} from '@element-plus/icons-vue'

import elIcons from './elIcons'

// 图标映射对象（供 registerIcons / icons 按名查找）
const AllIcons = {
  User, Lock, Edit, Close, Search, Refresh, FullScreen, Delete, Remove, Plus,
  WarnTriangleFilled, Check, EditPen, SwitchButton, Baseball, Upload, Download,
  CopyDocument, CircleCheck, MoreFilled, Expand, Top, Fold, Right, Bottom,
  ArrowLeft, ArrowDown, ArrowRight, CircleClose, Sunny, Moon, Setting,
  QuestionFilled, UserFilled, Iphone, Message, Comment
}

// 导出图标对象（可选）
export const icons = Object.fromEntries(
  elIcons.map(name => [name, AllIcons[name]])
)

// 导出注册函数
export const registerIcons = (app) => {
  elIcons.forEach(name => {
    // console.log('注册图标:', name)
    app.component(name, AllIcons[name])
  })
}