---
layout: post
title: ALSA 用户空间之 TinyAlsa
category: kernel
keywords: [alsa, tinyalsa, android]
description: TinyAlsa 的使用
---

## {{ page.title }}

> "Of course you can just use it as a tool, but some people are interested
> in how it works, and want to change it, and it’s not doesn’t have to be
> just a tool." -- Dr. Seymour Papert

*TinyAlsa*是 Android 默认的 alsalib, 封装了内核 ALSA 的接口，用于简化用户空
间的 ALSA 编程。

### 设计目标

*TinyAlsa*的设计目标是：

- Provide a basic pcm and mixer API.
- If it's not absolutely needed, don't add it to the API.
- Avoid supporting complex and unnecessary operations that could be dealt
  with at a higher level.

可以看出，*TinyAlsa*是个很轻量级的库，很容易让我们一窥究竟。

### 接口

在<q>include/asoundlib.h</q>头文件里声明了*TinyAlsa*的所有接口。

    /* Open and close a stream */
	struct pcm *pcm_open(unsigned int card, unsigned int device,
                     unsigned int flags, struct pcm_config *config);
    int pcm_close(struct pcm *pcm);
	int pcm_is_ready(struct pcm *pcm);
    /* PCM API*/
	int pcm_write(struct pcm *pcm, const void *data, unsigned int count);
	int pcm_read(struct pcm *pcm, void *data, unsigned int count);
	int pcm_mmap_write(struct pcm *pcm, const void *data, unsigned int count);
    int pcm_set_avail_min(struct pcm *pcm, int avail_min);
	/* MIXER API */
	mixer_ctl_get_XX(struct mixer_ctl *ctl);
	mixer_ctl_set_XX(struct mixer_ctl *ctl);

头文件没有暴露`struct pcm`的内部成员，这意味着调用者只能使用它的API对音频设备
访问。
在播放操作时，`pcm_mmap_write()`比`pcm_write()`减少了内存拷贝的开销，但
由于它需要增加系统调用来同步数据指针，在缓冲区小的情况下，效率不一定总是更高，
但它提供了更好的灵活性。


### 用户配置

合理的`pcm_config`可以做到更好的低时延和功耗，移动设备的开发优为敏感。

    struct pcm_config {
        unsigned int channels;
        unsigned int rate;
        unsigned int period_size;
        unsigned int period_count;
        enum pcm_format format;
        unsigned int start_threshold;
        unsigned int stop_threshold;
        unsigned int silence_threshold;
        int avail_min;
    };

解释一下结构中的各个参数，每个参数的单位都是*frame*(`1帧 = 通道*采样位深`)：

- `period_size`. 每次传输的数据长度。值越小，时延越小，cpu占用就越高。
- `period_count`. 缓之冲区period的个数。缓冲区越大，发生*XRUN*的机会就越少。
- `format`. 定义数据格式，如采样位深，大小端。
- `start_threshold`. 缓冲区的数据超过该值时，硬件开始启动数据传输。如果太大，
  从开始播放到声音出来时延太长，甚至可导致太短促的声音根本播不出来;如果太小，
  又可能容易导致*XRUN*.
- `stop_threshold`. 缓冲区空闲区大于该值时，硬件停止传输。默认情况下，这个数
  为整个缓冲区的大小，即整个缓冲区空了，就停止传输。但偶尔的原因导致缓冲区空，
  如CPU忙，增大该值，继续播放缓冲区的历史数据，而不关闭再启动硬件传输(一般此
  时有明显的声音卡顿)，可以达到更好的体验。
- `silence_threshold`. 这个值本来是配合`stop_threshold`使用，往缓冲区填充静音
  数据，这样就不会重播历史数据了。但如果没有设定`silence_size`,这个值会生效吗？
  求解？？
- `avail_min`. 缓冲区空闲区大于该值时，`pcm_mmap_write()`才往缓冲写数据。这个
  值越大，往缓冲区写入数据的次数就越少，面临*XRUN*的机会就越大。Android
  samsung tuna 设备在*screen_off*时增大该值以减小功耗，在*screen_on*时减小该
  值以减小*XRUN*的机会。

在不同的场景下，合理的参数就是在性能、时延、功耗等之间达到较好的平衡。

### 实现

有朋友问为什么在`pcm_write()/pcm_mmap_write()`，而不在`pcm_open()`调用
`pcm_start()`? 这是因为音频流与其它的数据不同，实时性要求很高。作为
*TinyAlsa*的实现者，不能假定在调用者`open`之后及时的`write`数据，所以只能在有
数据写入的时候`start`设备了。

*Mixer*的实现很明了，通过`ioctl()`调用访问`kcontrols`.


*TinyAlsa*说复杂的操作应该由上层来处理，可能指的是重采样、插件功能等。但由于
 不能直接访问声卡设备，以至于要添加一些功能，如非阻塞打开声卡等，只能修改它的
 源代码才能实现。导出pcm的文件描述符就有那么难么☹

~EOF~ {% include post_date.span %}
