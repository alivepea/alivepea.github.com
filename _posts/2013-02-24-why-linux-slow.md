---
layout: post
title: 为什么linux系统变慢了
category: linux
keywords: [linux， iotop, top, free]
description: 查看linux系统变慢的原因
---

## {{ page.title }}


“系统变得很慢了，让我重启一下”，这个被经常使用且有效的做法真的很粗暴。
作为程序员最亲密的伙伴，可以待它温柔多些。

在linux发行版中，内核很稳定，极少出现bug，所以通常是某个应用导致系统变慢。
只要查出是哪些应用导致的，`kill`之就可以了。

### cpu占用
linux下自带的工具`top`可以实时显示当前cpu的使用情况。

	$ top
	$ pkill -9 chrome # 假定chrome进程cpu的占用100%

不像windows，到处都是杀不死的小强。`SIGKILL`信号可以轻易杀掉该进程。
自此，cpu终于过上`农夫山泉有点田`的生活了，cpu风扇也安静下来了。


### 内存占用
当某应用由于内存泄漏，内存滥用等导致要频繁的读写swap分区，或者在`OOM Killer`自动清除掉一些进程时，
系统就会变的很慢，就像房源被少数人控制后，即使只想摊上个刚需房也是天大的难事。

	$ free -m # 检查 swap 分区占用
	$ ps -eo pid,%mem,cmd --sort %mem
	$ pkill -9 chrome

这样，chrome滥用/泄漏的内存资源被全部回收，并分配给其它需要的进程，绝对不会从中收受群众的一房一地。


### IO占用
IO占用一般是指频繁的读写磁盘的时候，如拷贝大量的小文件，执行定时任务`updatedb`等，也可能让系统产生卡顿感。
跟`top`相似，`iotop`可以实时的显示当前io读写情况。

	$ sudo emerge iotop # 安装iotop
	$ sudo iotop # 新的linux版本需要超级权限

如果这个任务不是紧急的，仍然可以用`pkill`杀掉该任务，让它闲时重新执行。或者`tar`成一个大的存档文件再读写。
如果觉得上面步骤太繁琐，`sudo /etc/init.d/xdm restart` 重启一下`Xwindow`可解决大部分问题。

送给应用组的同事：原本生活可以更美的☺

~EOF~ {% include post_date.span %}
