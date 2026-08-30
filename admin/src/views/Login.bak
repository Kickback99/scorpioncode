<template>
  <el-row class="login-page">
      <el-col :span="12" class="bg"></el-col>
      <el-col :offset="3" :span="6" class="form">
          
    <el-form
      ref="ruleFormRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      class="demo-ruleForm"
      :size="formSize"
      status-icon
      v-if="isRegister"
      >
      <!-- 注册表单 -->
      <el-form-item>
          <h1>注册</h1>
      </el-form-item>
      <el-form-item prop="username">
        <el-input :prefix-icon="User"  placeholder="请输入用户名" v-model="formData.username"/>
      </el-form-item>
  
      <el-form-item prop="password">
        <el-input :prefix-icon="Lock"  placeholder="请输入密码" v-model="formData.password"  show-password/>
      </el-form-item>
  
      <el-form-item prop="repassword">
        <el-input :prefix-icon="Lock" placeholder="请输入确认密码" v-model="formData.repassword" show-password/>
      </el-form-item>
      <el-form-item>
        <el-button @click="registerEve" type="primary" class="button">注册</el-button>
      </el-form-item>
      <el-form-item class="flex">
      <el-link type="info" :underline="false" @click="isRegister = false;clearRegisterData()">
          ← 返回
          </el-link>
      </el-form-item>
    </el-form>
  
            
    <el-form
      ref="ruleFormRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      class="demo-ruleForm"
      :size="formSize"
      status-icon
      v-else
      >
      <!-- 登录表单 -->
      <el-form-item>
          <h1>登录</h1>
      </el-form-item>
      <el-form-item prop="username">
        <el-input :prefix-icon="User"  placeholder="请输入用户名" v-model="formData.username"/>
      </el-form-item>
  
      <el-form-item prop="password">
        <el-input :prefix-icon="Lock"  placeholder="请输入密码" v-model="formData.password"  show-password/>
      </el-form-item>
      <el-form-item>
          <div class="flex">
              <el-checkbox>记住我</el-checkbox>
              <el-link type="primary">忘记密码？</el-link>
          </div>
      </el-form-item>
      <el-form-item>
        <el-button :loading="loading" @click="loginEve" auto-insert-space type="primary" class="button">登录</el-button>
      </el-form-item>
      <el-form-item class="flex">
      <el-link type="info" :underline="false" @click="isRegister = true;clearRegisterData()">
          ← 注册
          </el-link>
      </el-form-item>
    </el-form>
  
      </el-col>
  </el-row>
  </template>
  
  <script setup>
  import {ref} from 'vue'
  import { ElMessage } from 'element-plus'
  import {User,Lock} from '@element-plus/icons-vue'
  import {userRegisterService,adminLoginApi} from '@/api/admin'
  import {useTokenStore} from '@/store/token'
  const tokenStore = useTokenStore()
  const ruleFormRef = ref(null)
  const isRegister = ref(false)
  import { useRoute, useRouter } from 'vue-router'; //编程式导航需要引入useRouter
  const router = useRouter()
  const route = useRoute()
  
  // 绑定表单数据
    const formData = ref({
      username:'',
      password:'',
      repassword:''
    })


  
  // 检验确认密码规则
  const checkRePassword = (rule,value,callback)=>{
      if(!value){
          callback(new Error('请输入密码'))
      }else if(value != formData.value.password){
          callback(new Error('两次密码填写不一致'))
      }else callback()
  }
  
  // 绑定表单校验规则
    const rules = {
      username : [    
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 4, max: 20, message: '用户名必须是 5-10位 的字符', trigger: 'blur' },
    ],
      password : [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { pattern:/^\S{4,15}$/,message:'密码必须是 4-15位 的非空字符',trigger:'blur'}
      ],
      // 自定义校验规则
      repassword: [
        { validator: checkRePassword, trigger: 'blur' }    
      ]
    }
  
    //t_user_request：用户注册请求
  const registerEve = async() => {
      //预校验：注册成功之前，先进行校验，校验成功 ➟ 请求，校验失败 ➟ 自动提示
      await ruleFormRef.value.validate()
      delete formData.value.repassword
      await userRegisterService(formData.value)
      // console.log('开始发送注册请求...')
      ElMessage.success('注册成功')
  
      
  }
  
  //t_user_request：用户登录请求

  const loading = ref(false)

  const loginEve = async() =>{
    await ruleFormRef.value.validate()
    loading.value = true
    try {
    const res = await adminLoginApi(formData.value)
    console.log(res.data)
    tokenStore.setToken(res.data)
    ElMessage.success('登录成功')
    loading.value = false
    // 从本地存储中获取原始路由的查询参数
    const originalRouteQuery = JSON.parse(localStorage.getItem('originalRouteQuery'));
     // 如果存在保存的路由信息，则重定向到该路由
      if (originalRouteQuery) {
        // 使用带有查询参数的路径重定向用户
        console.log('从本地跳转')
        if(originalRouteQuery.path === '/404'){
          router.push('/')
          localStorage.removeItem('originalRouteQuery');
          return;
        }
        router.push({ path: originalRouteQuery.path, query: originalRouteQuery.query });
        // 清除保存的路由信息
        localStorage.removeItem('originalRouteQuery');
      } else {
        // 如果没有保存的路由信息，可以重定向到首页或其他默认页面
        console.log('开始重定向')
        let redirect = route.query.redirect
        router.push({path: redirect || '/'});
      }
    } catch (error) {
      loading.value = false
    }
    
  }
  
  </script>
  
  <style scoped lang="scss">
  .login-page {
      height: 100vh;
      // background-color: red;
      .bg {
          background: url('@/assets/logo2.png') no-repeat 60% center / 240px auto,
              url('@/assets/login_bg.jpg') no-repeat center / cover;
          border-radius: 0 20px 20px 0;
      }
  
      .form {
          display: flex;
          flex-direction: column;
          justify-content: center;
  
       
              .flex {
                  width: 100%;
                  display: flex;
                  justify-content: space-between;
              }
  
              .el-button {
                  width: 100%;
              }
      }
  }
  </style>