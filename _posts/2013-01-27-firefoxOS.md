---
layout: post
title: Firefox OS 初探
category: linux
keywords: [B2G, Firefox OS, webapp]
description: 编译运行 Firefox OS
---

## {{ page.title }}
> "Firefox OS is a new mobile operating system developed by Mozilla's Boot to Gecko (B2G) project."


`Firefox OS`和`LIMO, WebOS, Bada`不一样的地方是，可以完整的下载到代码。
**NO source， You say a JB!**

### 编译，运行
`Firefox OS`的编译运行相比`Android`更简单一些,可能是因为它的依赖更少。

{% highlight bash %}
    $ git clone git://github.com/mozilla-b2g/B2G.git
    $ cd B2G
    $ ./repo sync -j4
    $ ./config.sh emulator
    $ ./build.sh -j4
    $ ./run-emulator.sh
{% endhighlight %}

`Firefox OS`基本上复用了`Android`大部分库，包括编译系统，模拟器，ADB，VOLD等，只是将`dalvik`换成了`b2g`。
<q>build.sh</q>，<q>config.sh</q>等脚本文件代替了<q>envsetup.sh</q>，显得好山寨啊☻
可能是由于不需要编译java的原因，编译时间比`android`要少很多。
[![FirefoxOS][FirefoxOS_t]][FirefoxOS]


### 安装应用
`Firefox OS`上安装应用有三种方法： 从`Marketplace`安装应用;
从任何一个网站的webapp链接安装; 也可以直接`adb push`到 <q>/data/local/webapps/</q> 目录下。

从`Marketplace`上安装的应用：[![yummi-squares][yummi-squares_t]][yummi-squares]

`adb push`进去的应用：它包含<q>application.zip</q>和<q>manifest.webapp</q>两个文件
[![webapp_alivepea][webapp_alivepea_t]][webapp_alivepea]


每个`webapp`运行在一个单独的`Content process`进程中，它的权限很低，使用`IPC`与`b2g`进程通信。
与`android`一样， 通过<q>manifest.webapp</q>申请系统权限。由于`webapp`不能直接访问系统资源，
感觉要比`android apk`更安全一些。

现在看起来， `Firefox OS`还不够成熟，比如官方开发者主页很多文档不全，系统在有的分辩率下布局可能混乱，
`emulator`启动时竟然还显示`android`的logo...
另外，`webapp`采用`html5+css+javascript`技术， 也就不能保护自己的代码了，不知道会不会让有的开发者有所顾忌。


~EOF~ {% include post_date.span %}

* * * * *
1. [Firefox OS](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox_OS)


[FirefoxOS]: /images/FirefoxOS.png "Firefox OS"
[FirefoxOS_t]: /images/thumbnails/FirefoxOS_t.png
[webapp_alivepea]: /images/webapp_alivepea.png "那一颗花生"
[webapp_alivepea_t]: /images/thumbnails/webapp_alivepea_t.png
[yummi-squares]: /images/yummi-squares.png "yummi squares game"
[yummi-squares_t]: /images/thumbnails/yummi-squares_t.png
