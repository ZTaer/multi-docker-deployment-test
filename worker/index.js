// 引入配置文件中的键值
const keys = require("./keys");
// 引入 redis 模块
const redis = require("redis");

// 创建 Redis 客户端
const redisClient = redis.createClient({
  host: keys.redisHost, // Redis 主机名
  port: keys.redisPort, // Redis 端口号
  retry_strategy: () => 1000, // 重试策略，每秒重试一次
});
const sub = redisClient.duplicate(); // 创建一个 Redis 客户端的副本，用于订阅消息

// 计算斐波那契数列的函数
function fib(index) {
  if (index < 2) return 1; // 如果索引小于2，返回1
  return fib(index - 1) + fib(index - 2); // 递归计算斐波那契数列
}

// 当接收到订阅频道的消息时
sub.on("message", (channel, message) => {
  redisClient.hset("values", message, fib(parseInt(message))); // 计算斐波那契数列并将结果存储在 Redis 中
});
// 订阅 'insert' 频道
sub.subscribe("insert");
