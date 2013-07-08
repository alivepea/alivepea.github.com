---
layout: post
title: 从Firefox迁移到Chrome
category: linux
keywords: [firefox, chrome , chromium]
description: firefox 与 chrome 浏览器的对比
---

## {{ page.title }}
> "Never interrupt your enemy when he is making a mistake."
> -- Napoleon Bonaparte

近半年来都在使用`chrome`，基本没再怎么用`firefox`。这放在半年前真难以想象。
在很多年前，在Linux下浏览网页`firefox`可能是唯一的选择。

如果不是`firefox`众多的插件，那它可能比`IE`好用不了多少。大浪淘沙之后，浏览器长驻的插件有：

+ Adblock
  广告拦截插件。它帮助我们阻挡了大量烦人的广告，比`IE`禁止自动弹窗功能要强大的多。
+ AutoProxy
  代理插件。作为一名秉承`自由开放`互联网精神的网民，没有理由不用它，它帮我们越过`GFW`，走向世界。
+ Flagfox
  显示网站服务器地点。
+ Greasemonkey
  用户脚本管理器。可以轻易的修改网页上的元素，比如高亮显示`Google Reader`的不同条目。
+ Speed Dial
  快速打开常用网站。
+ Textarea Cache
  缓存用户输入的文本内容，遇到网页异常崩溃后恢复。
+ Vimperator
  键盘控的神器，它就像酒鬼手中的酒杯，屌丝怀里的女神。*一经拥有，别无他求*。

二〇一一年起，越来越多的`firefox`的用户转到`chrome`，由于`chrome`一直没有`vimperator`，感觉再也不会爱了。但是但是...

+ `firefox`的升级经常导致插件不兼容而不能正常工作。
  譬如升级后`vimperator`很长一段时间没有更新导致不能用，转向`pentadactyl`后，同样的原因，它也用不了，只好换回`vimperator`。我不得不花费好几个小时为一个目标而学习使用两个插件，为他们写不同配置文件。这是要闹哪样啊？
+ `firefox`对新技术的支持总是慢一拍。
  譬如不支持WebGL，不能浏览[Google Body](http://zygotebody.com)，后来即使支持了，速度也比`chrome`不止慢一点点。
+ `firefox`的排版很糟糕。
  Linux下的`firefox`在缩放后，网页排版是错乱的(在windows下好像是正常的)，这真的让人难以忍受。
+ 速度，还是速度。
  很多时候，`chrome`真的要更快，特别是一些复杂的交互性强的网页。
+ `firefox`UI风格落伍老套了。
  尽管对于键盘控来说，这不应该成为衡量的标准之一，可连IE现在都知道界面要做到极简以尽可能最大化网页的阅读视图，你竟然...

`firefox`真的是一个非常好的浏览器，使用它有随心所欲的感觉。不过如果觉得自己很忠贞，很可能是诱惑不够大。尝试迁移到`chrome`后，安装了扩展后，竟然也觉得能够接受。

+ AdBlock
  与`firefox`基本一样。可以阻挡大部分广告，包括视频网站视频里内嵌的广告。
+ AutoPager
  自动翻页。
+ LastPass
  密码管理器，用于保存/自动填写用户密码。虽然号称安全性非常好，但真的没`firefox`自带的密码管理器简单好用。
+ Lazarus: Form Recovery
  与`Textarea Cache`类似。
+ Proxy SwitchySharp
  与`Autoproxy`类似。
+ Speed Dial 2
  与`firefox`一样。
+ Vimum
  只能说实现了一部分`vimperator`的功能。正是它让我迁移到`chrome`成为可能。

看的出来，`firefox`下的插件要强大的多，更能满足浏览的定制性需求。而`chrome`对新技术的支持更好，网页排版效果更好，界面精简速度一流。迁移到`chrome`后，虽然不能再使用`vimperator`而觉得很遗憾，却换来更流畅的浏览体验。`chrome`已经成为了我默认的浏览器。现在只有在特定情况下再使用`firefox`了，如使用`firebug`调试，`Firefox OS Simulator`开发等。

~EOF~ {% include post_date.span %}
