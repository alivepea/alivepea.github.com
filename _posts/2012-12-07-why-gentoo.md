---
layout: post
title: Gentoo ── 给力的企鹅
category: misc
tags: blog
published: true
---

## {{ page.title }}

> "The Linux philosophy is 'Laugh in the face of danger'. Oops.
> Wrong One. 'Do it yourself'. Yes, that's it."
> --- Linus Torvalds

“系统启动不了，等我重装下系统再提交代码...”，关键时候，好几次听到使用`ubuntu`的同事这样的抱怨。
我差点没忍住说，“`gentoo`从不知重装为何物”。

先说说自己的经历吧。在学校时，受到王垠雄文[^1]的感召， 就开始将自己的电脑完全`linux`化。
第一台笔电`Thinkpad T61`从开始服役安装`gentoo` 至不久前退役的五年里，从没有重装过。
公司的开发机自第一次使用安装完`gentoo`也从不担心系统没法启动的问题。
部门的几个同事在我的“感召”下也开始尝试`gentoo`...

就不口水`linux`与`windows`之间的优劣了，也不提`gentoo`的*portage*， *USE*，*make.conf*等等。
只从一个重度linux用户的角度说说使用`gentoo` 的感受。

### 清晰的系统层次

`gentoo`是个*metadistribution*，合适绝大部分应用场景。但这并不意味着它为了兼容变得臃肿，相反，
它非常的简洁清晰，可高度定制，专为你的硬件配置和需求而生。

+ <q>/etc/portage/</q> -- `portage`的用户配置模块，控制`emerge`时生成定制化的系统。
+ <q>/etc/{init,config}.d/</q> -- 系统服务启动脚本和配置脚本。
+ <q>/etc/runlevels/</q> -- 控制系统自启动服务的运行级别。
+ <q>/usr/portage/</q> -- `portage`数据库。
+ <q>/var/lib/portage/</q> -- 用户指定的软件包。
+ <q>/var/db/pkg/</q> -- 软件包的`emerge`日志。

通过这些*text*文件，知道`gentoo`将为我们做哪些，哪些不会做。


### 好用的管理工具

`gentoo`用户“好奇心”一般较小，不再喜欢不停的尝试其它的发行版，很大一个原因得益于`gentoo`基于`portage`提供的系统管理工具。
常用的有`gentoolkit`，`portage-utils`，`eix`，`genlop`...

+ 查询软件包： `$ eix chromium`
+ 安装软件包： `# emerge chromium`
+ 查询某个软件包所安装的文件： `$ equery f chromium`
+ 查询文件从属的软件包： `$ equery b /usr/bin/chromium`
+ 查询软件包的依赖： `$ equery g chromium`
+ 查询被依赖的软件包： `$ equery d icu`
+ 查询软件包的安装耗费的时间： `$ genlop -t chromium`
+ 查询含有某个工具的软件包： `$ e-file convert`

这些工具让我们容易清楚的知道“它”是怎么来的，为什么需要它。有“洁癖”的用户，不用猜疑哪些是系统必需，哪些是可以清除的。


### 良好的操作习惯

`gentoo`被人“诟病”的有，*不能开箱即用，安装繁琐*、*自己编译内核*、*软件包编译耗时*、*不合适初学者*...
但正是由于这些“毛病”，“帮助”用户养成了良好的操作习惯。

+ 习惯`CLI`，摆脱`GUI`依赖。
+ 习惯使用合适自己的效率工具，避免大众化工具的先入为主。
+ 习惯看日志自己修复系统，摆脱没完没了的上网搜索。
+ 习惯关注自己的工作，不再关心系统的升级。

久病成医，`gentoo`经验容易积累，随着用户使用时间的增长，系统效率和稳定性都随之增加。
对于重度`linux`用户来说，`gentoo`用户体验带来的收获远远大于初期的学习成本。


### 总结

从系统的构建方式上来说，`gentoo`介于`LFS`和`ubuntu`之间。不像`LFS`，`gentoo`有一个强大的包管理系统`portage`，
帮助管理软件包和解决软件包复杂的依赖问题; 也不像`ubuntu`，`gentoo`开始要小心冀冀的安装和配置好的系统。
也正由于这样，`gentoo`满足了系统的高度可配制，又免于系统维护的负担。

最后说一个对`gentoo`的“不满”，由于不像`ubuntu`一样经常装系统，所以经常不知道怎么告诉别人安装`gentoo` ;-)

~EOF~ {% include post_date.span %}

* * * * *
[^1]: [《王垠：完全用Linux工作》](http://www.douban.com/group/topic/12121637/)
