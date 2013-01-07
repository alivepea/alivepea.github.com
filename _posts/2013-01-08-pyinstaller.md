---
layout: post
title: 用pyinstaller交叉编译python程序
category: prog
keywords: [python, pyinstaller]
description: 在linux下将python程序编译成exe程序
---

## {{ page.title }}
> "I will learn it when I need it"
> -- anonymous

我是一名程序员，每当朋友们充满期待的让我帮他写一个程序的时候，我总是很难为情。因为既不熟悉图形界面的开发，也不懂windows下的开发。直到接触了*python+pyinstaller*之后，才让我可以在*linux*下轻松开发*windows*下的图形程序。

### 开发环境搭建
将python程序转换成exe程序的主要有两个：*py2exe*和*pyinstaller*。对于我来说，*pyinstaller*支持在*linux(wine)*的环境下运行，这就足够了。

以将[demo.py](https://gist.github.com/4477089)编译成<q>demo.exe</q>为例：

{% highlight bash linenos %}
$ wine msiexec /i /home/watson/dload/chrome/python-2.7.3.msi
$ wine /home/watson/dload/chrome/pywin32-218.win32-py2.7.exe
$ wine ~/.wine/drive_c/Python27/python.exe ~/bin/pyinstaller-2.0/pyinstaller.py -Fw demo.py
{% endhighlight %}

这样就生成了单一的可执行程序<q>dist/demo.exe</q>。使用*TKinter*作为图形界面开发库是由于它简单易用，生成的*exe*程序也很小。

### 遇到的问题
但世界并非那么完美。<q>demo.py</q>在windows下启动非常的慢，虽然它不到5M。

得益于*python*简单易学和跨平台，也得益于了*pyinstaller+wine*的完美组合，无需让用户安装*python*运行环境，
linux下的程序员可以真正意义上**Wrote once, run anywhere**。
