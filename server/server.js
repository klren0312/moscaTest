var mosca = require('mosca')

var pubsubsettings = {
	type:'mongo',
	url:'mongodb://localhost:27017/mqtt',
	pubsubCollection:'myCollections',
	mongo:{}
};
var settings = {
	port:1883,
	backend:pubsubsettings
};

//开启mosca
var server = new mosca.Server(settings);
server.on('ready',setup);
//当mqtt服务器准备好，触发
function setup() {
	console.log('Mosca server is up and running')
}
//当一个客户端连接时触发
server.on('clientConnected',function(client){
	console.log('client connected',client.id);
});
//当接收到一个消息时触发
server.on('published',function(packet,client){
	console.log('Published:',packet.payload);
});
//当一个客户端订阅了一个主题时触发
server.on('subscribed',function(topic,client){
	console.log('subscribed:',topic);
});
//当一个客户端取消订阅一个主题时触发
server.on('unsubscribed',function(topic,client){
	console.log('unsubscribed:',topic); 
});
//当一个客户端正在断开时触发
server.on('clientDisconnecting',function(client){
	console.log('clientDisconnecting:',client.id);
});
//当一个客户端已经断开连接
server.on('clientDisconnected',function(client){
	console.log('clientDisconnected :' ,client.id);
});
