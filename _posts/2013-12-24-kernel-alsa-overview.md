---
layout: post
title: 内核ALSA简览
category: kernel
keywords: [kernel, alsa, asoc, architecture]
description: 简述内核 Alsa 体系结构
---

## {{ page.title }}

> "Being abstract is something profoundly different from being vague… The
> purpose of abstraction is not to be vague, but to create a new semantic
> level in which one can be absolutely precise." -- Edsger Dijkstra

不像其它的子系统，`声音子系统Alsa`在内核的实现位于<q>$src/sound</q>单独的目录
下，而不是<q>$src/drivers</q>目录。不知道是不是因为这部分的代码庞大，可又显得
“杂乱无章”。

### Alsa 体系结构

数据结构`snd_card`用来表征一个声卡设备，从中可以看出alsa实现的大概轮廓。

    struct snd_card {
	int number;			/* number of soundcard (index to
								snd_cards) */

	char id[16];			/* id string of this card */
	char driver[16];		/* driver name */
	char shortname[32];		/* short name of this soundcard */
	char longname[80];		/* name of this soundcard */
	char mixername[80];		/* mixer name */
	char components[128];		/* card components delimited with
								space */
	struct module *module;		/* top-level module */

	void *private_data;		/* private data for soundcard */
	void (*private_free) (struct snd_card *card); /* callback for freeing of
								private data */
	struct list_head devices;	/* devices */

	unsigned int last_numid;	/* last used numeric ID */
	struct rw_semaphore controls_rwsem;	/* controls list lock */
	rwlock_t ctl_files_rwlock;	/* ctl_files list lock */
	int controls_count;		/* count of all controls */
	int user_ctl_count;		/* count of all user controls */
	struct list_head controls;	/* all controls for this card */
	struct list_head ctl_files;	/* active control files */

	struct snd_info_entry *proc_root;	/* root for soundcard specific files */
	struct snd_info_entry *proc_id;	/* the card id */
	struct proc_dir_entry *proc_root_link;	/* number link to real id */

	struct list_head files_list;	/* all files associated to this card */
	struct snd_shutdown_f_ops *s_f_ops; /* file operations in the shutdown
								state */
	spinlock_t files_lock;		/* lock the files for this card */
	int shutdown;			/* this card is going down */
	int free_on_last_close;		/* free in context of file_release */
	wait_queue_head_t shutdown_sleep;
	atomic_t refcount;		/* refcount for disconnection */
	struct device *dev;		/* device assigned to this card */
	struct device *card_dev;	/* cardX object for sysfs */
	};

英文注释很多，很直白。再解释以下几个成员：

- **devices**. 所有snd_device的链表头. snd_device是alsa的内部表示，既与设备模型中
  的设备无关，也与文件系统中的字符设备无关。一个声卡就是若干个snd_device 的集
  合，各个snd_device实现自己的操作方法集。常用的设备类型有的 CONTROL/PCM/TIMER...
- **controls**. 通过设备节点<q>/dev/snd/controlCx</q>提供给用户空间的controls. 常
  用于控制音量，音频流的通路等。
- **ctl_files**. 若干个进程打开<q>/dev/snd/controlCx</q>时生成`ctl_file`的链
  表头。一般用于pcm有多个substream时配置选用哪个substream.
- **proc**. <q>/proc/asound/cardX/</q>节点。<q>/proc/asound/cards</q>下可打印
    出<q>idx [id]: driver-shortname \n longname</q>
- **dev**. 此声卡的父设备，通过何种方式挂载声卡。如usb/pci/platform...
- **card_dev**. 此些声卡自己的设备，用于注册到设备模型。如pci声卡，位于
    <q>/sys/devices/pci0000:00/0000:00:1b.0/sound/card0/</q>.

总结一下以上凌乱的描述：

Alsa是管理若干个声卡设备的子系统，一个声卡`snd_card`由多个`snd_device`子设备
组成。在snd_card注册/销毁的时回调所有子设备的`snd_devices_ops`方法，用以支持
各子设备的注册和热插拨等操作。

snd_card还为子设备提供字符设备注册接口，需要注册到字符设备的子设备如
control/pcm根据minor通过snd_card的`f_op->open方法snd_open()`绑定到各自的
`file->f_op`上。字符设备的命名规则一般为<q>设备类型+Cα+Dβ</q>，
如card0上的control设备<q>controlC0</q>,
card1上pcm0 playback设备<q>pcmC1D0p</q>,
card1上的pcm1 capture设备<q>pcmC1D1c</q>.

内核Alsa的核心代码文件组织如下：

    sound
    ├── core
    │   ├── compress_offload.c 实现某些可硬件解码的音频流的用户接口。alsa-lib上已有封装好的编程接口。
    │   ├── control.c 通过设备节点 /dev/snd/controlCx 实现声卡的音量控制/声道切换等。
    │   ├── device.c 各种子设备如 pcm/control/timer... 的注册接口。
    │   ├── info.c 实现procfs下文件访问接口。
    │   ├── init.c 实现声卡设备的创建/销毁等。
    │   ├── pcm_*.c 实现pcm设备的文件系统接口。
    │   ├── sound.c Alsa子系统。
    │   └── timer.c
    ├── drivers 其它的声卡如虚拟声卡(dummp/loopback)等。
    ├── oss
    ├── isa/pci/pcmcia 各种总路线上的声卡在alsa上的实现。
    ├── ppc/sh/mips 平台自己的实现。
    ├── soc ASOC子系统的实现。
    └── spi/usb spi/usb声卡。

下面是一张alsa的架构草图，真的很草哟...

[ ![alsa][alsa_t_image] ][alsa_image]

[alsa_t_image]: /images/thumbnails/alsa_t.png "alsa subsystem"
[alsa_image]: /images/alsa.png "alsa subsystem"


pci/usb/soc之于alsa犹如ext2/fat/xfs之于vfs,就是实现alsa中的pcm/control等子设
备的操作方法集。
同时，alsa还向sysfs注册到设备模型，透过procfs可以查看card的信
息，如pcm的配置信息，状态等。

### 总结

本篇只透过分析snd_card这个顶层的数据结构简述alsa的架构设计。control和pcm这两
个重要的声音子设备在以后的篇幅里另加剖析了。

如果说用户空间的*TinyAlsa*为应用封装了alsa的系统调用接口，那内核空间的ALSA更
像是一套编程框架，支持各式声卡设备，为应用空间提供统一的系统调用接口。

~EOF~ {% include post_date.span %}
