---
layout: post
title: Gentoo下调试libc
category: linux
keywords: [gentoo, portage, splitdebug, libc]
description: Gentoo下搭建友好的调试环境
---

## {{ page.title }}

机器出现几次libc抛出 'heap corruption' 的异常。想在代码上查一下malloc到底做了
什么，于是在gentoo环境下搭建一个用于调试glibc的环境。

### 生成带符号信息的libc

新建一个调试用的配置文件<q>/etc/portage/env/splitdebug.conf</q>

    CFLAGS="$CFLAGS -ggdb3"
	CXXFLAGS="$CXXFLAGS -ggdb3"
	FEATURES="$FEATURES splitdebug installsources"

为 glibc 指定这个配置文件<q>/etc/portage/package.env/packages.env</q>

	sys-libs/glibc splitdebug.conf

重新编译glibc，生成带调试信息的libc.

	# emerge debugedit # installsources 依赖debugedit
	# emerge -1 -q sys-libs/glibc file
	# /usr/lib/debug/lib64/libc-2.18.so.debug
	 /usr/lib/debug/lib64/libc-2.18.so.debug: ELF 64-bit LSB shared object,
	 x86-64, version 1 (SYSV), dynamically linked (uses shared libs), for
	 GNU/Linux 2.6.16, not stripped

为glibc指定`splitdebug installsources`features后，portage将为 unstripped 的
glibc 保存到<q>/usr/lib/debug/</q>目录，同时还将源代码保存到
<q>/usr/src/debug</q>目录。由于系统运行时的libc依然会被stripped，这样做不会影
响系统运行的性能。

gdb不需要任何设定就可以源代码级调试libc了，如下图。

[ ![malloc-debug][malloc-debug_t_image]][malloc-debug_image]

[malloc-debug_t_image]: /images/thumbnails/malloc-debug_t.png "malloc-debug"
[malloc-debug_image]: /images/malloc-debug.png "malloc-debug"

Gentoo真是一个对开发者非常友好的linux发行版。

~EOF~ {% include post_date.span %}
