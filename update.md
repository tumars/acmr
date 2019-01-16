# Update log
## 0.9.2 2019-01-16
1. 修改content ULR匹配规则，修复翻页后Show Name失效的问题

## 0.9.1 2019-01-16
1. popup添加了Show Name按钮，以显示新版界面名称
2. popup添加了Order Room按钮，导航到新版预订页
3. 优化了background流程逻辑

## 0.9.0 2018-12-28
1. 更换了登陆状态图标
2. 优化重构了background和popup页面代码
3. 新增加打开popup检查cookies功能
4. background页面增加签到记录输出监控

## 0.8.2 2018-12-27
添加检查登陆状态后更改图标功能

## 0.8.1 2018-11-28
1. popup页面添加了立即检查签入按钮和反馈信息显示
2. 开启了cookies使用权限，并对签入必须的cookies补充了检查行为

## 0.8.0 2018-11-26
1. 删除了content_script.js及manifest.json中相应配置
2. 去掉了background.js中测试代码

## 0.7.5  2018-11-24
1. 在manifest.json中添加background部分。
2. 根据脚本实际使用位置，将原background.js改为content_script.js，并放置于content_script部分。
3. 测试了background.js执行中cookies的发送问题，确认可以发送，以防登陆错误。
