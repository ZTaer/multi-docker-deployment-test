// 引入配置文件中的键值
const keys = require("./keys");

// Express App Setup
const express = require("express"); // 引入 Express 框架
const bodyParser = require("body-parser"); // 引入 body-parser 中间件
const cors = require("cors"); // 引入 cors 中间件

const app = express();
app.use(cors()); // 使用 CORS 中间件，允许跨域请求
app.use(bodyParser.json()); // 使用 body-parser 中间件，解析 JSON 请求体

// Postgres Client Setup
const { Pool } = require("pg"); // 引入 pg 模块中的 Pool 类
const pgClient = new Pool({
  user: keys.pgUser, // PostgreSQL 用户名
  host: keys.pgHost, // PostgreSQL 主机名
  database: keys.pgDatabase, // PostgreSQL 数据库名
  password: keys.pgPassword, // PostgreSQL 密码
  port: keys.pgPort, // PostgreSQL 端口号
  ssl:
    process.env.NODE_ENV !== "production"
      ? false
      : { rejectUnauthorized: false }, // 根据环境设置 SSL
});

pgClient.on("connect", (client) => {
  // 在数据库中创建一个名为 values 的表（如果不存在）
  client
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch((err) => console.error(err));
});

// Redis Client Setup
const redis = require("redis"); // 引入 redis 模块
const redisClient = redis.createClient({
  host: keys.redisHost, // Redis 主机名
  port: keys.redisPort, // Redis 端口号
  retry_strategy: () => 1000, // 重试策略，每秒重试一次
});
const redisPublisher = redisClient.duplicate(); // 创建一个 Redis 客户端的副本，用于发布消息

// Express 路由处理程序

// 根路径的 GET 请求处理程序
app.get("/", (req, res) => {
  res.send("Hi"); // 响应 'Hi'
});

// 获取所有 PostgreSQL 数据库中的值
app.get("/values/all", async (req, res) => {
  const values = await pgClient.query("SELECT * from values"); // 查询所有值
  res.send(values.rows); // 发送查询结果
});

// 获取 Redis 数据库中的当前值
app.get("/values/current", async (req, res) => {
  redisClient.hgetall("values", (err, values) => {
    res.send(values); // 发送当前值
  });
});

// 向数据库中插入新的值
app.post("/values", async (req, res) => {
  const index = req.body.index; // 获取请求体中的 index

  // 如果 index 大于 40，返回 422 状态码
  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }

  redisClient.hset("values", index, "Nothing yet!"); // 在 Redis 中设置初始值
  redisPublisher.publish("insert", index); // 发布插入事件
  pgClient.query("INSERT INTO values(number) VALUES($1)", [index]); // 在 PostgreSQL 中插入值

  res.send({ working: true }); // 响应工作状态
});

// 监听 5000 端口
app.listen(5000, (err) => {
  console.log("Listening"); // 控制台输出 'Listening'
});
