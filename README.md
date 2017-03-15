>作者：Arvind Ravulavaru
翻译：治电小白菜
原文地址：http://thejackalofjavascript.com/getting-started-mqtt/
**注意**：发现文章中用的`mqtt`模块版本过低，导致有些语法失效了，比如，创建客户端的函数`createClient`在最新版的`mqtt`已经失效.改用为`mqtt.connect`。这些我已经在代码中做了更改，并且已经运行成功。

在这篇文章中，我们将瞧一瞧一个通信协议，名字叫做Message Queue Telemetry Transport (MQTT).MQTT是一个轻量的，安全的，省电的以及一个机器对机器（M2M）/“物联网”（Internet of Things）的连接协议。

来自Cirrus Link Solutions的Andy Stanford-Clark 和 Arlen Nipper 在 1999 年编写了这个协议的第一个版本。

#**什么是MQTT**
>**MQTT**(全称Message Queue Telemetry Transport)是一个基于顶层TCP/IP协议的有发布/订阅功能的轻量通信协议。它被设计来连接需要“小型代码封装”（“small code footprint”）或者网络带宽被限制的远程区域。发布/订阅信息模式要求一个信息代理。信息代理负责分发信息给订阅了一个信息话题的客户端。
<br >
说明文档没有明确“小型代码封装”（“small code footprint”）和“限制网络带宽”的含义。因此，协议的可用性取决于上下文的使用。在2013年，IBM将MQTT V3.1提交给 OASIS规范，确定只对规范进行可接受的小幅动的改动。MQTT-SN是一个主协议的变种，针对在non-TCP/IP网络下的嵌入式设备，比如ZigBee。
<br>
历史上，‘MQTT’的‘MQ’来自于IBM的MQ消息队列产品线。然而，队列本身不需要在所有情况下支持作为标准特性。

**现实世界的应用**
>Facebook Messenger:Facebook已经在Facebook Messenger很多方面中使用了MQTT。然而还不确定使用了多少MQTT以及在哪个方面使用了MQTT；另外，要注意这是一个手机应用，不是一个传感器应用。

#**理解OSI模型**
为了更加理解MQTT的使用范围，你需要对OSI模型有一定的理解。如果你已经知道了这个，你可以跳过下面的视频。
<br>
翻墙观看：https://www.youtube.com/embed/sVDwG2RdJho?rel=0
<br>
MQTT和HTTP处于同一层，是第7层。

#**为什么选择MQTT？**
 1. 它是一个订阅/发布协议
 2. 它有不同质量的服务等级（QOS）
 3. 它有消息至少处理一次（at-least-once)和只执行一次（exactly-once）语义
 4. 它有一个很低的日常开支（最少2bytes）
 5. 它支持离线信息
 6. 它像一个键/值存储一样来保留信息

Matteo Collina，`Mosca`的作者，给了一个很棒的演说，来演讲什么是MQTT以及它如何通过Nodejs工作。
<br>
翻墙观看：https://www.youtube.com/embed/WE7GVIFRV7Q?rel=0
<br>
你可以在这个网址查看他关于MQTT和Node.js演讲的演示。`http://mcollina.github.io/mqtt_and_nodejs/`

#**MQTT将会被应用到哪里？**
想象下面的环境

![mqtt_arch.png](http://upload-images.jianshu.io/upload_images/2245742-6958be6557f58f77.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


在单个机器/设备的状态/传感器数据需要传递给其他机器/设备，以及一个实时仪表、一个平板或者一个可穿戴设备。连接和维持数据传输，很多设备或许是棘手的。这种情况下可以使用MQTT。

#**亲自动手**
现在我们已经对于MQTT有了一定的理解，我们将尝试一个简单的例子。我们将实现一个服务/代理 通过Mosca来接收数据并发放到所有他的客户端。然后我们将使用MQTT.js实现一个MQTT客户端从代理处发布和订阅一个话题。
<br>
创建一个名为`mqttApp`的文件夹，我们将在它里面创建两个文件夹，分别叫`server`,`client`.
<br>
在`server`文件夹内打开命令行，创建一个新的Node.js项目，通过运行
   

     npm init

然后，我们将安装Mosca依赖，以及保存它到package.json中。运行

    npm install mosca --save
    

在`server`文件夹内创建名为`server.js`的文件。将以下代码写入其中
```
var mosca = require('mosca')
var settings = {
port: 1883
};
//here we start mosca
var server = new mosca.Server(settings);
server.on('ready', setup);
// fired when the mqtt server is ready
function setup() {
console.log('Mosca server is up and running')
}
// fired whena  client is connected
server.on('clientConnected', function(client) {
console.log('client connected', client.id);
});
// fired when a message is received
server.on('published', function(packet, client) {
console.log('Published : ', packet.payload);
});
// fired when a client subscribes to a topic
server.on('subscribed', function(topic, client) {
console.log('subscribed : ', topic);
});
// fired when a client unsubscribes to a topic
server.on('unsubscribed', function(topic, client) {
console.log('unsubscribed : ', topic);
});
// fired when a client is disconnecting
server.on('clientDisconnecting', function(client) {
console.log('clientDisconnecting : ', client.id);
});
// fired when a client is disconnected
server.on('clientDisconnected', function(client) {
console.log('clientDisconnected : ', client.id);
});
```

一个简单的MQTT代理服务器。这些事情要注意
 - **Line1**：引入 Mosca
 - **Line3**：配置服务器
 - **Line8**：开启服务器
 - **Line12**：当服务器开启后回调
 - **Line17**：*clientConnected*：当一个客户端连接后，客户端会被当作参数传递。
 - **Line22**：*published*：当一个新消息被发布；数据包和客户端将被作为参数传递。
 - **Line27**：*subscribed*：当一个客户端订阅了一个主题；主题和客户端会被当作参数传递。
 - **Line32**：*unsubscribed*：当一个客户端取消订阅了一个主题；主题和客户端都会被当作参数传递。
 - **Line37**：*clientDisconnecting*：当一个客户端正在断开连接；客户端会被当作参数传递。
 - **Line42**：*clientDisconnected*：当一个客户端已经断开连接；客户端会被当作参数传递。

简单的 pub/sub API
<br>
如果你想启用离线模式，我们需要存储数据到一个键值对的数据库。开箱即用的Mosca支持大多数著名的键值对数据库。下面是一个快速的例子，教你如何使用它，使用MongoDB。
<br>
更新`server.js`
```
var mosca = require('mosca')
var pubsubsettings = {
type: 'mongo',
url: 'mongodb://localhost:27017/mqtt',
pubsubCollection: 'myCollections',
mongo: {}
};
var settings = {
port: 1883,
backend: pubsubsettings
};
//here we start mosca
var server = new mosca.Server(settings);
server.on('ready', setup);
// fired when the mqtt server is ready
function setup() {
console.log('Mosca server is up and running')
}
// fired whena  client is connected
server.on('clientConnected', function(client) {
console.log('client connected', client.id);
});
// fired when a message is received
server.on('published', function(packet, client) {
console.log('Published : ', packet.payload);
});
// fired when a client subscribes to a topic
server.on('subscribed', function(topic, client) {
console.log('subscribed : ', topic);
});
// fired when a client subscribes to a topic
server.on('unsubscribed', function(topic, client) {
console.log('unsubscribed : ', topic);
});
// fired when a client is disconnecting
server.on('clientDisconnecting', function(client) {
console.log('clientDisconnecting : ', client.id);
});
// fired when a client is disconnected
server.on('clientDisconnected', function(client) {
console.log('clientDisconnected : ', client.id);
});
```

只有在第3行有改变。我们在那里增加了MongoDB设置。（*你可以使用一个服务像Mongo Lab，将数据存储到云里。*）然后我们在第12行处引入这些设置.
<br>
在我们启动服务器之前，我们需要启动MongoDB实例。如果你是MongoDB新手，可以看看这个http://thejackalofjavascript.com/mapreduce-in-mongodb/#mongodb
<br>
一旦MongoDB启动，我们将通过下面的命令开启服务器

    node server.js

如果MongoDB开启并运行了，你应该就能看到成功的信息。否则你将看到一堆错误。
<br>
这是一个简单的实现离线功能的代理服务器。在我们更进一步之前，我们将更新我们的服务器变成一个实时的代理服务器。使用下列代码更新`server.js`
```
var mosca = require('mosca')
var settings = {
port: 1883,
persistence: mosca.persistence.Memory
};
var server = new mosca.Server(settings, function() {
console.log('Mosca server is up and running')
});
server.published = function(packet, client, cb) {
if (packet.topic.indexOf('echo') === 0) {
return cb();
}
var newPacket = {
topic: 'echo/' + packet.topic,
payload: packet.payload,
retain: packet.retain,
qos: packet.qos
};
console.log('newPacket', newPacket);
server.publish(newPacket, cb);
}
```
这里我们钩取了一个服务器发布事件的回调，然后创建了一个新的数据包包含每个接受到的信息，然后将新的数据包发送给客户端。
<br>
<br>
现在，我们将构建一个可以发布/订阅主题的MQTT客户端。在`client`文件夹内打开一个命令行。
<br>
我们的客户端将是另一个Node.js应用。在这个例子里，都是运行在同一个机器。但是在正式情况下，客户端程序将被部署到实际的设备上，比如Pi或者Arduino。以及服务器将会被部署到云中。
<br>
现在，运行

    npm init

MQTT.js依赖将会被引入，运行

    npm install mqtt --save

在`client`文件夹内创建一个名为`client1.js`的文件。我们将在本地机器中模拟两个客户端，来看事件如何运作的。在`client1.js`中写入以下代码
```
var mqtt = require('mqtt')
// client = mqtt.createClient(1883,'localhost');
var client  = mqtt.connect('mqtt://127.0.0.1:1883')
client.on('connect', function () {
  client.subscribe('presence')
  client.publish('presence', 'Client 1 is alive.. Test Ping! ' + Date())
  console.log('Client publishing..')
  client.end()
})

```
以下事情需要注意
 - **Line1**：我们需要MQTT 
 - **Line3**：我们连接到服务器
 - **Line5**：我们订阅一个名为“presence”的主题
 - **Line8**：我们发布一个消息到“presence”
 - **Line10**：我们关闭客户端

<br>
我们将创建另一个客户端，来监听“presence”话题的改变。在`client`文件中创建一个名为`client2.js`的文件。在其中写入以下的代码
```
var mqtt = require('mqtt')
// client = mqtt.createClient(1883,'localhost');
client  = mqtt.connect('mqtt://127.0.0.1:1883')
client.subscribe('presence');
client.on('message',function(topic,message){
	console.log(message.toString());
});
console.log('client started ...');
```

和`client1.js`一样，除了这个客户端只是监听主题的改变
<br>
为了测试这个，第一步我们将开启服务器。运行

    node server.js

然后你应该能够看到服务器开启日志。然后运行 client2

    node client2.js

你应该能看到客户端开启日志。最后运行 client1

    node client1.js

服务器命令行应该会有反映

![1.png](http://upload-images.jianshu.io/upload_images/2245742-21a9230ea71d0559.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)



最后的数据包是我们“presence”主题。以及client2 命令行应该看到这个

 
![2.png](http://upload-images.jianshu.io/upload_images/2245742-7001afb4f2de3065.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


简单明了的基于MQTT协议的会话！
<br>
你可以在这里看到这个例子的完整代码。https://github.com/arvindr21/mqttApp

<br>

可以看Matteo Collina 的视频，关于他现场编码一个机器人以及通过网页控制它 – LXJS 2014
<br>
翻墙观看：https://www.youtube.com/embed/BxJ-27Nnakc?rel=0
<br>

希望这篇文章能给你一些关于如何在Node.js中使用MQTT的思路。
<br>
@arvindr21