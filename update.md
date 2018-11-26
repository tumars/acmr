# update log

## 0.7.6 2018-11-26
1. 删除了content_script.js及manifest.json中相应配置
2. 去掉了background.js中测试代码

## 0.7.5  2018-11-24
1. 在manifest.json中添加background部分。
2. 根据脚本实际使用位置，将原background.js改为content_script.js，并放置于content_script部分。
3. 测试了background.js执行中cookies的发送问题，确认可以发送，以防登陆错误。
