/**
 * 用户模块，包含如下功能点：
 *	4.1用户登录功能点
 *	4.2用户注册功能点
 */
const express = require('express')
const pool = require('../pool')
let router = express.Router()    //创建路由器
module.exports = router

/**
 * 4.1用户登录功能点
 * 请求方法：
 * 	POST
 * 请求URL：
 * 	/user/register
 * 请求参数：
 * 	类型: application/json
 * uname 		必需 注册用户名
 * upwd  		必需 密码
 * phone 		必需 电话
 * captcha	必需 验证码
 * 返回消息：
 * {
 * 	"code": 200,
 * 	"msg": "register success",
 * 	"uid": 7
 * }
 *		
 *	
 */
router.post('/register', (req,res,next)=>{	
	let uname = req.body.uname
	let upwd = req.body.upwd
	let phone = req.body.phone
	let captcha = req.body.captcha
	if(!uname){
		let output = {
			code: 400,
			msg: 'uname required'
		}
		res.send(output)
		return
	}

	if(!upwd){
		let output = {
			code: 401,
			msg: 'upwd required'
		}
		res.send(output)
		return
	}

	if(!phone){
		let output = {
			code: 400,
			msg: 'phone required'
		}
		res.send(output)
		return
	}
	
	// if(!captcha){
	// 	let output = {
	// 		code: 400,
	// 		msg: 'captcha required'
	// 	}
	// 	res.send(output)
	// 	return
	// }
	// 此处给中间件进行处理

	let sql = 'SELECT uid FROM user WHERE uname=?'
	pool.query(sql,uname,(err,result)=>{
		if(err){
			next(err)
			return
		}

		if(result.length>0){
			let output = {
				code: 501,
				msg: 'uname already exists'
			}
			res.send(output)
			return
		}

		let sql = 'SELECT uid FROM user WHERE phone=?'
		pool.query(sql,phone,(err,result)=>{
			if(err){
				next(err)
				return
			}
			if(result.length>0){
				let output = {
					code: 502,
					msg: 'phone already exist'
				}
				res.send(output)
				return
			}

			// 验证码验证
			let captcha = req.body.captcha
			if(!captcha){
				let output = {
					code: 406,
					msg: 'captcha required'
				}
				res.send(output)
				return
			}

			// captcha = captcha.toLowerCase() 
			console.log(req.session.captchaRegister,captcha)
			if(captcha != req.session.captchaRegister){
				let output = {
					code: 407,
					msg: 'captcha err'
				}
				res.send(output)
				return
			}
			delete req.session.captchaRegister

			let sql = 'INSERT INTO user(uname,upwd,phone) VALUES(?,?,?)'
			pool.query(sql,[uname,upwd,phone],(err,result)=>{
				if(err){
					next(err)
					return
				}
				let output = {
					code: 200,
					msg: 'register succ',
					uid: result.insertId
				}
				res.send(output)

			})
		})
	})


})

router.post('/login',(req,res,next)=>{
	let uname = req.body.uname
	if(!uname){
		let output = {
			code: 401,
			msg: 'uname required'
		}
		res.send(output)
		return
	}
	let upwd = req.body.upwd
	if(!upwd){
		let output = {
			code: 402,
			msg: 'upwd required'
		}
		res.send(output)
		return
	}

	let sql = 'SELECT uid,uname,nickName FROM user WHERE uname=? AND upwd=?'
	pool.query(sql,[uname,upwd],(err,result)=>{
		if(err){
			next(err)
			return
		}

		if(result.length===0){	//根据客户端提交的uname和upwd没有查询到相关记录
			let output = {
				code: 405,
				msg: 'uname or upwd error'
			}
			res.send(output)
			return 
		}
		//根据客户端提交的uname和upwd查询到相关记录
		req.session.userInfo = result[0]
		let output = {
			code: 200,
			msg: 'login succ',
			userInfo: result[0]
		}
		// console.log(req.session)
		//3.发送响应消息
		res.send(output)
	})
})

// 引入工具模块
const random = require('../util/random')
// 引入fs模块
const fs = require('fs')
const loginCheck = require('../middleware/loginCheck')
router.post('/upload/avatar',loginCheck)  //修改头像之前必须登录
// 文件上传 下载模块
const multer = require('multer')
let upload = multer({dest: './temp'})
router.post('/upload/avatar',upload.single('avatar'))
router.post('/upload/avatar',(req,res,next)=>{
	// 获取当前登录的用户id
	let uid = req.session.userInfo.uid
	// 读取客户端上传的文件内容
	console.log(req.body,req.file,uid)
	// 保存客户端上传文件的描述对象
	let file = req.file
	let oldPath = file.path
	let newPath = 'img-avatar/' + random.randFileName(file.originalname)
	fs.rename(oldPath,'./public/'+newPath,(err)=>{
		if(err){
			next(err)
			return
		}

		// 重置数据库中的登录头像地址
		let sql = 'UPDATE user SET avatar=? WHERE uid=?'
		pool.query(sql,[newPath,uid],(err,result)=>{
			if(err){
				next(err)
				return
			}
		
			let output = {
				code: 200,
				msg: 'avatar upload and changed',
				fileName: newPath
			}
			res.send(output)
		})

	})
})