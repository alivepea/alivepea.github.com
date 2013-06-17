---
layout: post
title: Bash 下的命令行补全
category: linux
keywords: [Bash, Bash-completion , 命令行补全]
description: Bash 下命令行补全编程
---

## {{ page.title }}

> "We will encourage you to develop the three great virtues of a programmer: laziness, impatience, and hubris." -- LarryWall

Bash使用很容易敲击的<kbd>Tab</kbd>作为触发键就知道`CLIer`是多么频繁的使用它。那Bash下的补全是怎么工作的呢？

### Bash下的补全
Bash下的补全是通过内置命令*complete/compgen*来实现的。

	$ ls -l /etc/bash_completion.d/	# 系统启动时搜索的补全脚本
    $ complete -p    ＃ 当前环境的补全命令
	$ compgen -W 'This is COMP_WORDS' -- COMP	# 根据输入从Wordlist中得到补全列表

当你想为某个命令加上补全功能时，即可写该命令的补全脚本放到<q>/etc/bash_completion.d/</q>目录下。

### 补全脚本编程
`complete`根据内置变量生成补全列表的。写补全脚本时也要利用Bash的这些内置变量。

	COMPREPLY	用于生成补全列表的数组
	COMP_WORDS	当前命令行的输入单词数组
	COMP_CWORD	输入单词数组的索引

在命令行输入的时候，`${COMP_WORDS[COMP_CWORD]}`表示光标处的单词， `${COMP_WORDS[COMP_CWORD-1]}`表示前一些单词，补全就是根据光标所在单词的位置得到`COMPREPLY`。如`fastboot`的补全脚本

    # bash completion for fastboot

    _fastboot () {
        local cur prev
        cur=${COMP_WORDS[COMP_CWORD]}
        prev=${COMP_WORDS[COMP_CWORD-1]}

        case $prev in
    	flash)
    	    COMPREPLY=( $(compgen -W 'zimage system zip ramdisk boot hboot' -- "$cur") )
    	    return;;
    	oem)
    	    COMPREPLY=( $(compgen -W 'writecfg' -- "$cur") )
    	    return;;
    	zimage|system|zip|boot|hboot|recovery)
    	    _filedir
    	    return;;
        esac


        if [[ "$cur" == -* ]]; then
    	COMPREPLY=( $(compgen -W '-w -s -l -p -c' -- "$cur") )
    	return
        fi

        opt="$(fastboot help 2>&1 | \grep '^  [[:alpha:]-]' | awk '{print $1}')"
        COMPREPLY=( $(compgen -W "$opt oem" -- $cur) )
    }

    complete -o default -F _fastboot fastboot

`-F`指定补全函数。`Bash`还提供了一些辅助函数如`_filedir/_get_comp_words_by_ref`等简化补全脚本的编程。

~EOF~ {% include post_date.span %}
