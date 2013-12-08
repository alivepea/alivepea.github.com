---
layout: post
title: Qemu下调试内核
category: kernel
keywords: [qemu, kernel, gdb]
description: 利用 Qemu 源代码级调试linux内核
---

## {{ page.title }}

> "You can use a kernel debugger if you want to, and I won't give you the
>  cold shoulder because you have "sullied" yourself." -- Linus Torvalds


程序员生在这个互联网时代是幸福的，因为可以找到很多的文档和工具帮助分析代码。
但也是很不幸的，因为像内核一样的代码膨胀到如此之巨，以至于根本弄不明白为什么
为什么这样写。*Linus*甚至不愿意为内核添加一个调试器，在这封
[邮件](http://linuxmafia.com/faq/Kernel/linus-im-a-bastard-speech.html)中给出
了理由。对于这些对内核的理解炉火纯青，如神一般的存在开发者来说，这理由很可能
是很对的。但对于大部分凡人来说，使用调试器还是可以更快的了解内核某个部分的工
作原理。分享一下自己经常使用的在`Qemu`下调试内核的一个方法。

### 搭建调试环境

`Qemu`内置了`gdbserver`的支持，通过`gdb`直接远端调试`Qemu`的目标机内核。

1. 选择合适的模拟目标。
   `Qemu`可以模拟很多的目标，比如，想了解`arm`中断的实现，
   那就可以选择`versatileab`模拟目标。如果想跟踪arm系统中网卡驱动的实现，那选
   择`smdkc210`就可以模拟`lan9118`网卡芯片了。官方没有文档说明哪个平台支持哪
   些外围设备，如果要调试某个特定的设备，只能查看`Qemu`源代码来选择模拟目标了。
   以下是我调试内核多核中断的脚本片断：

       kernel="./mach/vexpress/zImage"
       cmdline="root=/dev/ram0 rw console=ttyAMA0 rdinit=/linuxrc loglevel=10"
       initrd="./mach/vexpress/initrd"
       qemu-system-arm -nographic -net nic -net user,tftp="$(pwd)/tftp" -m 256M -smp 4 -M vexpress-a9 -kernel $kernel -append "$cmdline" -initrd $initrd $@ -s -S

   `Qemu`启动之后等待`Gdb`连接。

1. 调试器。
   选择一个合适的调试器，如`arm-linux-gdb`，我一般用`emacs`或`cgdb`做
   前端来调试。启动脚本如下：

       file vmlinux
       target remote tcp:localhost:1234
       b start_kernel
       c

   这时，内核将停在断点处`start_kernel`，等待`gdb`命令。如果想调试平台相关的
   内核启动代码，特别是在`_mmap_switched`mmu映射之前的代码，还需要手动修改符
   号表的偏移。


### 编译内核

要实现源代码级的调试，产生尽可能多的调试信息，还要修改内核的默认配置。

    # .config 添加
	CONFIG_FRAME_POINTER=y
	CONFIG_DEBUG_KERNEL=y
	# 修改 Makefile 中内核的编译选项，减少代码的优化
	KBUILD_CFLAGS += -fno-schedule-insns -fno-schedule-insns2
	KBUILD_CFLAGS += -O1

上面的修改减少了在单步调试时代码乱跳的情况。内核使用`-O0`的优化级别编译通不过，
这可能也是其它编译器无法编译内核的一个原因吧。


这样，就可以像调试应用程序一样，在`Gdb`下调试内核的启动、文件系统、设备模型、
网络子系统等等。另外，由于`Qemu`还可以模拟很多平台，包括外围设备，脱离物理机
就可以深入内核的移植、设备工作原理等。

~EOF~ {% include post_date.span %}
