---
layout: post
title: Git管理多个远程仓库
category: linux
keywords: [git, subtree]
description: 给Gentoo打补丁修复Urxvt光标丢失的Bug
---

## {{ page.title }}

> "640k ought to be enough for anybody."
> --Bill Gates

`TinyAlsa`有`Github`和`Android`两个`Git`不同的仓库。我希望本地的仓库可以同时
追踪它的更新。并且将自己的更改分别提交到这两个仓库本地分支上。*Git subtree*可
以很好的胜任这个任务。

### 实现方法

- 为远程仓库添加别名。

	  $ git remote add -f github https://github.com/tinyalsa/tinyalsa.git
      $ git remote add -f android https://android.googlesource.com/platform/external/tinyalsa

- 添加到本地仓库。

	  # 主分支不显示远程分支的日志
      $ git subtree add -P github --squash github/master
	  # 为远程分支创建本地分支，可基于本地分支开发
	  $ git subtree split -P github -b github --annotate="(github)"
	  $ git subtree add -P android --squash android/master
	  $ git subtree split -P android -b android --annotate="(android)"

- 更新远程仓库。

      $ git subtree pull --squash -P github
	  $ git subtree pull --squash -P android

- 对比两个远程仓库的差异

      $ git diff android github --

- 合并两个仓库

	  # 将Android分支的一个 commit
	  $ git cherr-pick 73b9c679a656c7b0f5e265dae5a76664c7d03031

### 好处

这至少带来以下几个好处：

- 一个仓库就可以很好的管理多个远程仓库。也更方便将本地的更改推送到本地中
  心仓库。
- 与多个仓库比起来，更方便远程仓库间的对比合并等操作。在得到最新的`github`代码同时，添
  加了`Android`的最新补丁。
- 在`master`分支，不用切换分支就可以在两个路径上为不同的仓库编译不同的镜像。


*git subtree*看起来*git submodule*要灵活些，还能替代*Repo*的某些功能。`Git`的
魔法真多啊，大大扩展了版本控制的应用场景。"永远不要觉得640K就足够了"

~EOF~ {% include post_date.span %}
