---
layout: post
title: Gdb调试内核的启动
category: kernel
keywords: [zImage, Image, kernel, gdb]
description: GDB 源代码调试内核的启动
---

## {{ page.title }}

> "调试是通过某种办法发现BUG进行修正的过程"
>  -- 《Debug Hacks》

在做`Kdump`时，发现`crashkernel`区域位于某些位置时，vmcore初始化总是失败。原
因是`Dump-Capture kernel`启动后已经不在`crashkernel`的区域内了，这显然是不对
的。原来是`Dump-Capture kernel`的映像zImage启动解压时重定向，将内核解压到非
crashkernel的区域，使用Image替代zImage来做`Dump-Capture kernel`就可以解决这个
问题了。

分享一下自己`Gdb`调试`zImage/Image`启动的一些方法，以更方便理解了内核启动中一
些魔法。以下方法可在`Qemu`下的`vexpress-a9`目标演示。


### Gdb调试zImage的启动

像日志[Qemu下调试内核](/kernel/qemu-kernel/)一样启动Qemu.Gdb连接到Qemu.

    (gdb) target remote tcp:localhost:1234

`vexpress-a9`的"BIOS"会在RAM的起始地址`0x60000000`处开始执行，初始化`atags`和
`processor id`,并跳转到`0x60010000`

    (gdb) b * 0x60010000
	(gdb) c

手工加载内核调试映像。`zImage`对应的ELF文件是
<q>$output/arch/arm/boot/compressed/vmlinux</q>,由于这个映像地址无关，手工添加符号表
到指定位置。

    (gdb) load vmlinux 0x60010000
	(gdb) add-symbol-file vmlinux 0x60010000
	(gdb) b start
	(gdb) c

至此，可以在源代码下单步调试`zImage`了。如果代码重定位了，再
`add-symbol-file`到指定位置就可以了。


### Gdb调试Image的启动

`Image`是自解压之后的内核映像，刚启动时，MMU还没有将内存映射到`vmlinux`的链接
地址。`Image`对应的ELF文件是<q>$output/vmlinux</q>, 需要加载映像到
`0x60008000`的内存位置。

    (gdb) target remote tcp:localhost:1234
	(gdb) b * 0x60010000
	(gdb) c
	(gdb) load vmlinux -0x60000000

通过`$ arm-linux-readelf -S vmlinux`得到符号表段的偏移后，加载符号表到相应的
内存物理地址。

	(gdb) add-symbol-file  vmlinux 0x60008240 -s .head.text 0x60008000 -s .rodata 0x60479000

修改pc地址以修正`load`指令更新的默认pc地址。

    (gdb) set $pc=0x60008000
	(gdb) b stext
    (gdb) c

至些，像调试普通应用一样，可以一直调试到打开MMU `__enable_mmu`为止。此后，就
要重新`add-symbol-file`到相应的虚拟地址，即`vmlinux`的链接地址。


在真实的目标机中，如使用`Trace32`调试内核的启动代码，方法也是一样的。

另外，使用调试器查看汇编代码，似乎也是学习汇编代码一个好途径。

~EOF~ {% include post_date.span %}
