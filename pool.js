/**
 * Mysql 数据连接池
 */

const mysql = require('mysql');

module.exports = mysql.createPool({
	host     : '127.0.0.1',
	port     : 3306,
	user     : 'root',
	password : '',
	database : 'iweb',
	connectionLimit: 10
})