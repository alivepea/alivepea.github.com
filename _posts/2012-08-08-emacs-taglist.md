---
layout: post
title: emacs 的 taglist
category: linux
keywords: [emacs, taglist, cedet]
description: emacs下实现taglist
---

## {{ page.title }}

> "一切在于配置"

在`vim`的年代里，经常用`taglist`浏览代码结构和跳转。
`emacs`可用`speedbar`实现类似的功能。

### 安装

* **cedet**

利用`cedet`，`speedbar`可以给我们更多有用的信息，命令行会提示该符号的参数等。
{% highlight bash lineno %}
$ emerge -avqu cedet
{% endhighlight %}

### 配置

`speedbar`默认的配置将符号自动分组，但对于大屏幕来说，这没有必要。
{% highlight ec linenos %}
(setq speedbar-tag-hierarchy-method nil)
{% endhighlight %}

### 效果

  [ ![speedbar][speedbar_t_image] ][speedbar_image]

[speedbar_t_image]: /images/thumbnails/speedbar_t.png "i2c susbsystem"
[speedbar_image]: /images/speedbar.png "i2c subsystem"

[emacswiki](http://emacswiki.org)里有关于将`speedbar`嵌入到`emacs`窗口的扩展。但在`awesome`窗口管理器下使用，`speedbar`在另一个窗口也挺很方便。
