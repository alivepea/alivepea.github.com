---
layout: post
title: 内核性能调试--ftrace
category: kernel
keywords: [kernel, trace, linux]
description: 通过 trace 进行系统性能分析
---

## {{ page.title }}
> “调试难度本来就是写代码的两倍.因此,如果你写代码的时候聪明用尽,根据定义,你就没有能耐去调试它了.”
> -- Brian Kernighan

某手机公司的研发总监谈到内核调试时问我怎么android手机上解决有时整机响应慢甚至无响应的情况。
我说可以首先使能内核的调试选项检查是否存在内核死锁，再通过内核的kprobe/ftrace检查中断和系统调用情况，blabla...
没想到该总说“我们公司几百号人都没有用trace，你能用得起来？”。难怪即使几百号人做手机，每个人还得被强制加班☕

据说，linus等大神级内核开发者不用调试器，顶多用`printk`打印信息。 对于寻常百姓来说，
每改一行代码都希望能马上看到效果，一次次的编译内核，就像盲人摸象一样，这时`printk`就像烧火棍一样，
难堪重用，调试效率效率非常的低。`ftrace`是内核内置的跟踪器，可用于跟踪内核函数调用，中断延迟，调度延迟，
系统调用等，在`debugfs`下使用文本命令交互，很合适内核开发者使用。

### 使用 ftrace
首先使用`CONFIG_DEBUG_FS`，`CONFIG_FTRACE_*`选项后重新编译内核。需要注意的是，
由于这时编译器打开`-pg`选项，内核映像加入了大量的调试信息，内核运行速度会变慢。
所以正式发布的版本都应该关闭此选项。

	# mount -t debugfs nodev /sys/kernel/debug
	# cd /sys/kernel/debug/trace

该目录下包含很多文件，用于`设定/过滤/查看`等，如：

* 内核中断

查看当前系统的中断情况

	# echo 0 > tracing_on
	# echo > trace
	# echo nop > current_tracer
	# echo irq > set_event
	# echo 1 > tracing_on
	# cat trace_pipe
	 tracer: nop
	 entries-in-buffer/entries-written: 0/0   #P:1
	
	                              _-----=> irqs-off
	                             / _----=> need-resched
	                            | / _---=> hardirq/softirq
	                            || / _--=> preempt-depth
	                            ||| /     delay
	           TASK-PID   CPU#  ||||    TIMESTAMP  FUNCTION
	              | |       |   ||||       |         |
	cat-1449  [000] d.h.  3927.679420: irq_handler_entry: irq=4 name=serial
	...


* 内核调用

查看内核函数的调用情况

    # echo > set_event
	# echo 0 > tracing_on
	# echo > trace
    # echo function_graph > current_tracer
	# echo 1 > tracing_on
	# cat trace_pipe

	tracer: function_graph
	
	CPU  DURATION                  FUNCTION CALLS
	 |     |   |                     |   |   |   |
	0) + 26.523 us   |                      }
	0)               |            finish_task_switch() {
	0)   ==========> |
	0)               |              smp_apic_timer_interrupt() {
	0)               |                irq_enter() {
	0)   0.911 us    |                  rcu_irq_enter();
	0)   6.503 us    |                }
	0)               |                hrtimer_interrupt() {
	0)   0.585 us    |                  _raw_spin_lock();
	0)   1.124 us    |                  ktime_get_update_offsets();
	CPU:0 [LOST 163499 EVENTS]
	------------------------------------------
	0)  kworker-691   =>    cat-1464   
	------------------------------------------

	0)               |                              serial8250_default_handle_irq() {
	0)   0.954 us    |                                io_serial_in();
	...


* 内核函数的profile

打印当前内核的函数profile

	# echo > current_tracer
	# echo 1 > function_profile_enabled
	# cat trace_stat/function0 
	Function                               Hit    Time            Avg             s^2
	--------                               ---    ----            ---             ---
	__schedule                            7113    968683296 us     136184.9 us     2108946573 us 
	schedule                              1687    954817829 us     565985.6 us     1349415472 us 
	sys_poll                                25    63786678 us     2551467 us     582022796 us 
	do_sys_poll                             25    63786547 us     2551461 us     566803126 us 
	poll_schedule_timeout                   25    63771744 us     2550869 us     1312623772 us 
	schedule_hrtimeout_range                25    63771626 us     2550865 us     1305229109 us 
	schedule_hrtimeout_range_clock          25    63771510 us     2550860 us     1293434582 us 
	schedule_timeout                        29    34992964 us     1206653 us     1503283302 us 
	...

上面仅列出`ftrace`的三种应用场景，其它更多的说明可见<q>Documentation/trace/ftrace.txt</q>。
通过`ftrace`可以实时的跟踪内核的运行情况，通过分析它的日志，一般能较快的找出内核的性能瓶颈。

~EOF~ {% include post_date.span %}
