---
layout: post
title: 为Gentoo打补丁
category: linux
keywords: [gentoo, portage, ebuild]
description: 给Gentoo打补丁修复Urxvt光标丢失的Bug
---

## {{ page.title }}

> "As our circle of knowledge expands, so does the circumference of darkness
>  surrounding it." -- Albert Einstein

一直工作的很好模拟终端*Urxvt*,这两天发现输入命令行时光标处在行末或空格的地方
时不显示了。不使用*Xft*字体不会有问题，*awesome*窗口管理器将终端窗口设为全屏
也不会有问题，好是诡异。想起前些时候更新过系统，很可能是这导致的。千辛万苦找
原因，终于在freedesktop发现*xf86-intel-video*的版本仓库中的一个`patch`可以解
决这个由GPU导致的问题。记录下怎么合并这个`patch`到自己的`Gentoo`系统中以解决
这个问题。

### 为Gentoo打补丁

为自己系统的某个软件打个补丁，最好的方法不是自己的手动编译安装，而是将它纳入
软件包管理器中，这样有利于这个软件的升级/卸载/处理依赖等。

- 创建*Overlay*.
  制作一个自己本地的*Overlay*，在<q>/etc/portage/make.conf</q>添加到*Portage*.

      PORTDIR_OVERLAY="/home/lab/github/ap-overlay/ $PORTDIR_OVERLAY"

- 添加*Ebuild*.
  基于系统当前安装的`Ebuild`修改，将新的<q>xf86-intel.patch</q>加入`Ebiuld`.

	  $ mkdir -p ap-overlay/x11-drivers/xf86-video-intel/files
	  # 版本号添加 r1,以让 portage 升级更新。
      $ cp /usr/portage/x11-drivers/xf86-video-intel/xf86-video-intel-2.99.906.ebuild  ap-overlay/x11-drivers/xf86-video-intel/xf86-video-intel-2.99.906-r1.ebuild
      $ cp ~/xf86-intel.patch xf86-video-intel/files/xf86-video-intel-2.99.906-cursor-disappear.patch
	  # 修改 ebuild
	  $ sed -i '45s/^/\t"${FILESDIR}"/${P}-cursor-disappear.patch\n/' xf86-video-intel-2.99.906-r1.ebuild
	  # 签名
	  $ ebuild xf86-video-intel-2.99.906-r1.ebuild manifest
	  # 用以下命令的输出查看这个 patch 是否会生效
	  $ ebuild xf86-video-intel-2.99.906-r1.ebuild prepare

- 安装。
  像系统软件包一样安装更新。

      $ sudo emerge -avu xf86-video-intel
      [ebuild   U   ] x11-drivers/xf86-video-intel-2.99.906-r1  USE="dri glamor sna udev uxa -xvmc"

Okay，搞定，`Urxvt`正常了。这样不用等待上游开发者更新，也不必捶桌子埋怨这个苦
逼的世界了。


不知道`Ubuntu`的童鞋碰到这类问题是怎么解决的(大部分小白可能早就放弃了)。
`Gentoo`下就是这么简直。“什么？ Ubuntu下就不会遇到这个问题，不需要折腾”。听
起来似乎没错，但对于大多`Linux`用户来说，你不折腾系统，它就会折腾你☺

~EOF~ {% include post_date.span %}
