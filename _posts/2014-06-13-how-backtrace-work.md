---
layout: post
title: Stack backtrace 的实现
category: prog
keywords: [kernel, arm, backtrace, dump_stack]
description: linux内核下arm回溯调用栈的实现
---

## {{ page.title }}

<var>Stack backtrace</var>栈回溯是指程序运行时打印出当前的调用栈。在程序调试、
运行异常时栈回溯显得非常有用。那栈回溯是如何实现的呢？

栈回溯的实现依赖编译器的特性，与特定的平台相关。以linux内核实现arm栈回溯为例，
通过向gcc传递选项`-mapcs`或`-funwind-tables`，可选择`APCS`或`unwind`的任一方
式实现栈回溯。

    Backtrace:
    [<80012540>] (dump_backtrace) from [<8001282c>] (show_stack+0x18/0x1c)
    r6:805e538c r5:00000006 r4:80532810 r3:00200140
    [<80012814>] (show_stack) from [<8021f628>] (dump_stack+0x24/0x28)
    [<8021f604>] (dump_stack) from [<80064c7c>] (backtrace_regression_test+0x38/0xcc)
    [<80064c44>] (backtrace_regression_test) from [<800088a8>] (do_one_initcall+0xe4/0x19c)
    r4:805ef30c r3:00000000
    [<800087c4>] (do_one_initcall) from [<805becf4>] (kernel_init_freeable+0x18c/0x248)
    r10:805bc180 r9:805be4dc r8:80624f80 r7:805e538c r6:805e538c r5:00000006
    r4:805ef30c
    [<805beb68>] (kernel_init_freeable) from [<80469ea4>] (kernel_init+0x10/0x100)
    r10:00000000 r9:00000000 r8:00000000 r7:00000000 r6:00000000 r5:80469e94
    r4:00000000
    [<80469e94>] (kernel_init) from [<8000f078>] (ret_from_fork+0x14/0x3c)

以上是内核打印出的调用栈，在每一行打印了被调用者(callee)的地址和调用者
(caller)调用它时的地址，还包括调用者函数体大小，调用点偏移和现场保存的寄存器。
程序的执行路径非常清晰直观。

### APCS

<var>ARM Procedure Call Standard</var>ARM过程调用标准规范了arm寄存器的使用、过程调用时
出栈和入栈的约定。如下图示意。

[ ![apcs convention][apcs_t_image] ][apcs_image]

[apcs_t_image]: /images/thumbnails/apcs_t.png "apcs"
[apcs_image]: /images/apcs.png "apcs"

函数的栈框(stack frame)由fp~sp标记边界。通过被调用者的fp和它的偏移，得到当前
栈保存的`fp,lr,pc`。通过pc可计算得到被调用者的地址，通过lr可计算得到调用者的
地址，再通过fp得到调用者栈框。需要注意的是`saved_pc`除了考虑指令偏移外，还要
考虑处理器的预取指长度，才能正确得到被调用者的地址。

上面说了如何通过当前栈得到被调用者地址和调用点的地址。那又是怎么输出函数名和
调用点偏移的呢？内核是通过格式化参数`printk("%pS", saved_pc)`来输出的，与其它
格式化参数不同，它的实现依赖内核`CONFIG_KALLSYMS`模块，这个模块记录了内核的函
数名，函数体大小等。

栈回溯中输出的寄存器的值是入栈时保存起来的寄存器值。它通过解析指令码得到哪个
寄存器压栈了，在栈中的位置。

如果编译器遵循APCS，形成结构化的函数调用栈，就可以解析当前栈(callee)结构，从
而得到调用栈(caller)的结构，这样就输出了整个回溯栈。


### unwind

APCS的缺陷是，维护栈框的指令过多，栈消耗大，占用的寄存器也过多，比如每次调用
都必须将r11,r12,lr,pc入栈。使用unwind就能避免这些问题，生产指令的效率要有用的
多。unwind是最新的编译器(>gcc-4.5)为arm支持的新特性。它的原理是记录每个函数的
入栈指令(一般比APCS的入栈要少的多)到特殊的段`.ARM.unwind_idx
.ARM.unwind_tab`。

下面是函数`proc_sys_write()`的汇编指令和unwind段的纪录：

	(gdb) disassemble  proc_sys_write
    Dump of assembler code for function proc_sys_write:
       0x8010064c <+0>:	push	{lr}		; (str lr, [sp, #-4]!)
       0x80100650 <+4>:	sub	sp, sp, #12
       0x80100654 <+8>:	mov	r12, #1
       0x80100658 <+12>:	str	r12, [sp]
       0x8010065c <+16>:	bl	0x80100588 <proc_sys_call_handler at fs/proc/proc_sysctl.c:481>
       0x80100660 <+20>:	add	sp, sp, #12
       0x80100664 <+24>:	pop	{pc}		; (ldr pc, [sp], #4)
    End of assembler dump.

    $ readelf -u .ARM.unwind_idx vmlinux
    0x8010064c <proc_sys_write>: 0x80028400
      Compact model index: 0
      0x02      vsp = vsp + 12
      0x84 0x00 pop {r14}

段中输出了函数的地址和对应的编码。接下输出的是编码对应的出栈伪指令，这些伪指
令正好是函数栈操作的逆过程。编码的目的是为减少段空间的浪费，表示有限的几条出
栈指令。编码方法可参见[libunwind](https://wiki.linaro.org/KenWerner/Sandbox/libunwind)

回溯时根据pc值到段中得到对应的编码，解析这些编码计算出lr在栈中的位置，进而计
算得到调用者的执行地址。


### 总结

对比APCS和unwind两种方法，编译器遵守APCS会产生更多的代码指令，对性能有影响，
使用unwind的方式会生成额外的段，但不影响性能。所以在大多情况下unwind是更好的选择。

~EOF~ {% include post_date.span %}
