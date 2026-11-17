# 手机私聊派任务

在同一台已安装 `lark-cli` 的电脑上，让飞书机器人接收本人的私聊文字，并把需要决定的卡片发回本人。需要在飞书开发者后台给应用开通 `im:message.p2p_msg:readonly`，订阅 `im.message.receive_v1` 和 `card.action.trigger`。只运行这一份飞书通道；CLI 的两个事件消费者共用同一事件总线。

先用 `agent-autoloop key new source mobile` 和 `agent-autoloop key new channel feishu` 创建两把不同的密钥。`config.json` 的 `channels` 增加：

```json
"feishu": {
  "key": "通道密钥",
  "sourceKey": "mobile 来源密钥",
  "user": "ou_本人的open_id",
  "lark": "C:/Users/wang/AppData/Roaming/npm/lark-cli.cmd"
}
```

`rules.json` 增加来源、通道和规则。下面的工作目录固定为本次要操作的项目；`worker` 名称应与本机配置一致。将现有规则合并保留，别覆盖整个文件。

```json
"sources": { "mobile": { "name": "飞书私聊" } },
"agents": { "phone-codex": { "name": "Codex", "worker": "wang", "use": "codex", "access": "edit" } },
"channels": { "feishu": { "name": "飞书", "answerers": ["ou_本人的open_id"] } },
"rules": [{
  "name": "手机处理 metgrow",
  "when": { "source": "mobile", "types": ["mobile.task"] },
  "to": "phone-codex",
  "cwd": "D:/11_PersonalSpace/Projects/metgrow",
  "parallel": 1,
  "tell": "always",
  "channels": ["feishu"],
  "prompt": "处理资料文件中的手机任务。先读项目说明与现状；需要本人决定时用 ask 提问并结束本轮。完成时用回执说明结果与验证。"
}]
```

运行 `agent-autoloop check` 检查规则，再重启中台。本人发给机器人的每条私聊文本会创建独立事项；消息先保存在本机 `feishu-inbox/`，中台记录成功且确认消息发出后才删除待提交文件。机器人回复事件编号。回复旧消息暂时也会创建新任务。任务文字只进入资料文件，不能指定 Agent、目录或权限。执行结果由 `tell: always` 作为卡片发送；问题卡片可在手机上回答。
