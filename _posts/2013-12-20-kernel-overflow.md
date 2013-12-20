---
layout: post
title: 检测内核的堆栈溢出
category: kernel
keywords: [kernel, stack, overflow, arm]
description: linux内核检测堆栈溢出的一些办法
---

## {{ page.title }}

> "如果建筑工人盖房子的方式跟程序员写程序一样，那第一只飞来的啄木鸟就将毁掉人
> 类文明。" -- Gerald Weinberg


内核堆栈溢出通常有两种情况。一种是函数调用栈超出了内核栈`THREAD_SIZE`的大小，
这是栈底越界，另一种是栈上缓冲越界访问，这是栈顶越界。


### 检测栈底越界

以arm平台为例，内核栈`THREAD_SIZE`为8K,当调用栈层次过多或某调用栈上分配过大的
空间，就会导致它越界。越界后`struct thread_info`结构可能被破坏，轻则内核
panic，重则内核数据被覆盖仍继续运行。

检测这类栈溢出较通用的办法是在每次中断到来的时候检查当前的栈指针sp是否超过了
某个阈值`STACK_WARN`。以下是在arm支持上`DEBUG_STACKOVERFLOW`的
<q>arm-debug_stackoverflow.patch</q>.

    --- a/arch/arm/include/asm/thread_info.h
    +++ b/arch/arm/include/asm/thread_info.h
    @@ -19,6 +19,9 @@
     #define THREAD_SIZE            8192
     #define THREAD_START_SP                (THREAD_SIZE - 8)

    +#define THREAD_MASK (THREAD_SIZE - 1UL)
    +#define STACK_WARN     (THREAD_SIZE / 8)
    +
     #ifndef __ASSEMBLY__

     struct task_struct;
    diff --git a/arch/arm/kernel/irq.c b/arch/arm/kernel/irq.c
    --- a/arch/arm/kernel/irq.c
    +++ b/arch/arm/kernel/irq.c
    @@ -56,6 +56,24 @@ int arch_show_interrupts(struct seq_file *p, int prec)
            return 0;
     }

    +static inline void check_stack_overflow(void)
    +{
    +
    +       register unsigned long sp asm ("sp");
    +
    +       sp &= THREAD_MASK;
    +
    +       /*
    +        * Check for stack overflow: is there less than STACK_WARN free?
    +        * STACK_WARN is defined as 1/8 of THREAD_SIZE by default.
    +        */
    +       if (unlikely(sp < (sizeof(struct thread_info) + STACK_WARN))) {
    +               printk("do_IRQ: stack overflow: %ld\n",
    +                      sp - sizeof(struct thread_info));
    +               dump_stack();
    +       }
    +}
    +
     /*
      * handle_IRQ handles all hardware IRQ's.  Decoded IRQs should
      * not come via this function.  Instead, they should provide their
    @@ -68,6 +86,8 @@ void handle_IRQ(unsigned int irq, struct pt_regs *regs)

            irq_enter();

    +       check_stack_overflow();

            /*
             * Some hardware gives randomly wrong interrupts.  Rather
             * than crashing, do something sensible.

以上的方法基于`内核的中断栈在当前的cpu线程栈上`和`内核栈8K对齐`两个前提。
这种方法有两个缺点：

- 栈已经溢出了,但中断还没来得及发生。使用`lkdtm`验证如下：

      # mount -t debugfs none /d
      # echo OVERFLOW > /d//provoke-crash/DIRECT

  在中断中没有得到警告信息。
- arm的中断很可能只发生在某个core上，并不是均等的，这样也不能检测其它的core上
  内核栈溢出。这可能也是内核没有为arm提供`DEBUG_STACK_OVERFLOW`的原因。

内核的`STACK_TRACER`是另一种检测栈底溢出更可靠的方法，选上内核配置
`CONFIG_STACK_TRACER`后，使用方法如下：

      # echo 10 > /sys/module/lkdtm/parameters/recur_count
	  # echo 1 > /proc/sys/kernel/stack_tracer_enabled
	  # cat stack_trace

打印出当前系统内核栈占用最多的函数。如果此时内核panic了，那也可以通过
`Kdump`得到RAMDUMP后，用`crash`工具查看是否由于栈底溢出导致的。

发现是由于内核栈溢出导致的问题后，不必抱怨内核栈太小。在堆上分配空间减小当前
栈空间的占用，或通过`workqueue`下半部的方式减小调用栈层次等可以解决这个问题。
不过内核栈真的很小，所以2.6的内核才将`task_struct`结构没有放置内核栈中，见
[这里](http://www.spinics.net/lists/newbies/msg22263.html)。


### 检测栈顶越界

对于栈顶越界，gcc提供了支持。打开内核配置`CONFIG_CC_STACKPROTECTOR`后，会打
开编译选项`-fstack-protector`.使用`lkdtm`验证如下：

      # echo CORRUPT_STACK > /d/provoke-crash/DIRECT 
      [ 1320.195246] lkdtm: Performing direct entry CORRUPT_STACK
      [ 1320.195681] Kernel panic - not syncing: stack-protector: Kernel stack is corrupted in: c03383dc

内核默认抛出panic.


内核的规模已经从小湖膨胀到大海一样，让身处其中的水手们晕头转向。如果用好内核
这些配备的雷达声纳等工具，是不是觉得世界稍美好了一点呢？

~EOF~ {% include post_date.span %}
