---
layout: post
title: 内核极简的内存分配器──Genalloc
category: kernel
keywords: [kernel, genalloc, 内存分配, 优先适配， 最佳适配]
description: 内核 genalloc 内存分配器的介绍
---

## {{ page.title }}

内核的`genalloc`是给一些需要自己维护内存分配的内核模块使用的，如SRAM, TCM,
Shared-memory等。它提供了`最先适配 fist-fit`和`最佳匹配 best-fit`两种分配算法。

### first-fit 和 best-fit

这两种都是通过`Bitmap`来标记内存中每个分配单元的状态，空闲或已分配。
*最先分配*是将第一个可容纳请求大小的的连续空闲空间分配出去。
*最佳分配*是将可容纳请求大小的的最小连续空闲空间分配出去。
假设某片内存被划分为10个最小单 元，这两种分配方法演示如下：

| Operation     | First-fit  | Best-fit   |
| Initial state | ➀➁➂➃➄➅➆➇➈➉ | ➀➁➂➃➄➅➆➇➈➉ |
| A: alloc(4)   | ➊➋➌➍➄➅➆➇➈➉ | ➊➋➌➍➄➅➆➇➈➉ |
| B: alloc(1)   | ➊➋➌➍➎➅➆➇➈➉ | ➊➋➌➍➎➅➆➇➈➉ |
| C: alloc(2)   | ➊➋➌➍➎➏➐➇➈➉ | ➊➋➌➍➎➏➐➇➈➉ |
| D: free(A)    | ➀➁➂➃➎➏➐➇➈➉ | ➀➁➂➃➎➏➐➇➈➉ |
| E: alloc(2)   | ➊➋➂➃➎➏➐➇➈➉ | ➀➁➂➃➎➏➐➑➒➉ |
| F: alloc(4)   | *failed*     | ➊➋➌➍➎➏➐➑➒➉ |

可以看出，这两种方法都会容易产生内存碎片，但Best-fit比First-fit要好一些，当然
这是以牺牲分配速度为代价的。


### 接口

用于描述一个内存池的数据结构：

    struct gen_pool {
    	spinlock_t lock;
    	struct list_head chunks;	/* list of chunks in this pool */
    	int min_alloc_order;		/* minimum allocation order */
    
    	genpool_algo_t algo;		/* allocation function */
    	void *data;
    };

- lock. 用于在添加chunks时锁保护。
- chunks. 一个内存池可包括多个内存块。
- min_alloc_order. 最小的分配单元。
- algo. 默认使用`gen_pool_first_fit`算法。
- data. 用于传递给`algo`的调用者私有数据。

用于描述内存块的数据结构：

    struct gen_pool_chunk {
    	struct list_head next_chunk;	/* next chunk in pool */
    	atomic_t avail;
    	phys_addr_t phys_addr;		/* physical starting address of memory chunk */
    	unsigned long start_addr;	/* start address of memory chunk */
    	unsigned long end_addr;		/* end address of memory chunk (inclusive) */
    	unsigned long bits[0];		/* bitmap for allocating memory chunk */
    };

- avail. 当前这个`chunk`的空闲内存。
- start_addr. 起始的虚拟地址，内存块的虚拟地址是连续的。物理地址可以不连续。
- bits[0]. 指向`Bitmap`，零长度数组，节省了一个指针的空间和一次kalloc()调用。

使用接口如下：

	/* 用于新建内存池 */
    extern struct gen_pool *gen_pool_create(int, int);
	/* 将某片虚拟地址连续的内存块添加到内存池 */
	extern int gen_pool_add_virt(struct gen_pool *, unsigned long, phys_addr_t,
			     size_t, int);
    /* 从内存池分配一定长度的内存 */
    extern unsigned long gen_pool_alloc(struct gen_pool *, size_t);
	/* 释放某块已分配的内存。
	 * 由于genalloc不记录每次分配的长度，所以释放的时候要传递长度参数。
	 * 这个长度如与分配时不一致，就可能导致内存的泄露或覆盖
	 */
	extern void gen_pool_free(struct gen_pool *, unsigned long, size_t);


上面的接口都在头文件<q>genalloc.h</q>声明了，但搞不懂为什么要暴露数据结构
`gen_poll`的成员和`gen_pool_chunk`.

### 实现

genalloc分配函数实现如下：

    unsigned long gen_pool_alloc(struct gen_pool *pool, size_t size)

    {
    	struct gen_pool_chunk *chunk;
    	unsigned long addr = 0;
    	int order = pool->min_alloc_order;
    	int nbits, start_bit = 0, end_bit, remain;
    
    #ifndef CONFIG_ARCH_HAVE_NMI_SAFE_CMPXCHG
    	BUG_ON(in_nmi());
    #endif
    
    	if (size == 0)
    		return 0;
    
    	nbits = (size + (1UL << order) - 1) >> order;
    	rcu_read_lock(); /* 保护 pool->chunks 的更新 */
    	list_for_each_entry_rcu(chunk, &pool->chunks, next_chunk) {
    		if (size > atomic_read(&chunk->avail)) /* 若当前内存空闲空间不足，尝试下一个内存块 */
    			continue;
    
    		end_bit = chunk_size(chunk) >> order;
    retry:
    		start_bit = pool->algo(chunk->bits, end_bit, start_bit, nbits,
    				pool->data);  /* 从chunk->bits的位图中找到合适的 */
    		if (start_bit >= end_bit)
    			continue;
			/* 将位图中要分配出去的块置位 */
    		remain = bitmap_set_ll(chunk->bits, start_bit, nbits); 
    		if (remain) { /* 并发的调用者置相同的位，则其中一个调用者重试 */
    			remain = bitmap_clear_ll(chunk->bits, start_bit,
    						 nbits - remain);
    			BUG_ON(remain);
    			goto retry;
    		}
    
    		addr = chunk->start_addr + ((unsigned long)start_bit << order);
    		size = nbits << order;
    		atomic_sub(size, &chunk->avail); /* 更新内存块的剩余空间 */
    		break;
    	}
    	rcu_read_unlock();
    	return addr;
    }

这个实现可以在原子上下文被调用。用`RCU`锁保护`pool->chunks`这个显然多读少写的
数据。不过`alog()`查找空闲块的算法是线性的，当管理很多的分配单元时，就不显得
高效了。

下面是实现的位图置位函数：

    /* *addr这个字的mask_to_set位置位的无锁实现 */
    static int set_bits_ll(unsigned long *addr, unsigned long mask_to_set)
    {
    	unsigned long val, nval;
    
    	nval = *addr;
    	do {
    		val = nval;
    		if (val & mask_to_set) /* 多个并发者置相同的位 */
    			return -EBUSY;
    		cpu_relax(); /* 内存屏障，保证val计算次序。听名字还以为是让cpu睡眠呢 */
		/* 注意 cmpxchg 是原子操作
		 * 如果由于并发竞争，更新失败就重试
		 */
    	} while ((nval = cmpxchg(addr, val, val | mask_to_set)) != val); 
    
    	return 0;
    }

    /* 位图map从start位开始置位nr位的无锁实现 */
    static int bitmap_set_ll(unsigned long *map, int start, int nr)
    {
    	unsigned long *p = map + BIT_WORD(start);
    	const int size = start + nr;
    	int bits_to_set = BITS_PER_LONG - (start % BITS_PER_LONG);
    	unsigned long mask_to_set = BITMAP_FIRST_WORD_MASK(start);
    
    	while (nr - bits_to_set >= 0) {
    		if (set_bits_ll(p, mask_to_set))
    			return nr;
    		nr -= bits_to_set;
    		bits_to_set = BITS_PER_LONG;
    		mask_to_set = ~0UL;
    		p++;
    	}
    	if (nr) {
    		mask_to_set &= BITMAP_LAST_WORD_MASK(size);
    		if (set_bits_ll(p, mask_to_set))
    			return nr;
    	}
    
    	return 0;
    }

上面这个实现有趣的地方是在发并时没有用锁保护`全局map`的更新，本质上是因为调用
者需要置位的位置不同，最小粒度的使用原子操作来同步，属于`多入口的 Lock-free`.


Genalloc容易产生内存碎片，寻找空闲块的复杂度是*Ο(n)*。但它的内存占用少，算法
简单，在分配单元不太多的情况下分配效率很高。除RCU外，对内核其它模块基本上没什
么依赖，很容易移植到应用程序中。内核另一个分配器是大名鼎鼎的`伙伴系统Buddy System`,
它在较少的内存碎片的同时，又可以高效的管理大量的内存单元。要快速的了解它的原理，请看
[这里](http://coolshell.cn/articles/10427.html).

~EOF~ {% include post_date.span %}
