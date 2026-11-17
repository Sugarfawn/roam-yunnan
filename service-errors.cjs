/* Return actionable messages without exposing requests, credentials or provider internals. */
function connectionMessage(error){
  const code=error?.cause?.code||error?.code;
  if(['ENOTFOUND','EAI_AGAIN'].includes(code))return '无法解析 DeepSeek 服务地址，请检查本机网络后重试。已有行程保留。';
  if(['ECONNRESET','ECONNREFUSED','ETIMEDOUT','UND_ERR_CONNECT_TIMEOUT'].includes(code))return '本地规划服务连接 DeepSeek 失败，请检查网络；若网络已恢复，请重启本地服务后重试。已有行程保留。';
  return '本地规划服务未能连接 DeepSeek。请确认服务仍在运行，并在网络恢复后重试；已有行程保留。';
}
module.exports={connectionMessage};
