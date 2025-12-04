module.exports = {
  apps : [{
    name   : "web-test",
    script : "./server.js",
    env: {
      PORT: 3000,
      NODE_ENV: "production",
    }
  }]
}
