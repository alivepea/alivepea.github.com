---
layout: post
title: GCC对尾递归的优化
category: prog
keywords: [gcc, c, tail recursion, 尾递归]
description: gcc对尾递归的优化
---

## {{ page.title }}

当函数返回的最后一个操作是递归调用时就被称作<var>尾递归</var>. 一直听说与普通
的递归比起来，尾递归效率很高，原因是尾递归没有函数栈调用的开销。下面验证一下。

    long long fact_aux(int n, long long result)
    {
    	printf("Local var in stack addr: 0x%x\n", &n);

    	if(n<2) return result;

    	return fact_aux(n-1, result*n);
    }

    long long fact(int n)
    {
    	return fact_aux(n, 1)
    }

上面是用递归计算阶乘的C语言实现，输出结果显示参数n在栈里的地址发现在递减，说
明函数栈在不断生成。用`objdump -d`或`(gdb) bt`也可以验证有没有函数栈调用的开
销。

    00000000004007e0 <fact_tr_aux>:
      4007e0:	53                   	push   %rbx
      4007e1:	31 c0                	xor    %eax,%eax
      4007e3:	48 89 f3             	mov    %rsi,%rbx
      4007e6:	be 04 09 40 00       	mov    $0x400904,%esi
      4007eb:	48 83 ec 10          	sub    $0x10,%rsp
      4007ef:	48 8d 54 24 08       	lea    0x8(%rsp),%rdx
      4007f4:	48 89 7c 24 08       	mov    %rdi,0x8(%rsp)
      4007f9:	bf 01 00 00 00       	mov    $0x1,%edi
      4007fe:	e8 4d fd ff ff       	callq  400550 <__printf_chk@plt>
      400803:	48 8b 7c 24 08       	mov    0x8(%rsp),%rdi
      400808:	48 89 d8             	mov    %rbx,%rax
      40080b:	48 83 ff 01          	cmp    $0x1,%rdi
      40080f:	7e 10                	jle    400821 <fact_tr_aux+0x41>
      400811:	48 0f af c7          	imul   %rdi,%rax
      400815:	48 83 ef 01          	sub    $0x1,%rdi
      400819:	48 89 c6             	mov    %rax,%rsi
      40081c:	e8 bf ff ff ff       	callq  4007e0 <fact_tr_aux> /* recursion call */
      400821:	48 83 c4 10          	add    $0x10,%rsp
      400825:	5b                   	pop    %rbx
      400826:	c3                   	retq
      400827:	66 0f 1f 84 00 00 00 	nopw   0x0(%rax,%rax,1)
      40082e:	00 00 

从上面的汇编上也看出依然是递归调用。 注释掉源代码的第2行, 再验证如下：

    00000000004007f0 <fact_tr_aux>:
      4007f0:	48 83 ff 01          	cmp    $0x1,%rdi
      4007f4:	48 89 f0             	mov    %rsi,%rax
      4007f7:	7e 15                	jle    40080e <fact_tr_aux+0x1e>
      4007f9:	0f 1f 80 00 00 00 00 	nopl   0x0(%rax)
      400800:	48 0f af c7          	imul   %rdi,%rax
      400804:	48 83 ef 01          	sub    $0x1,%rdi
      400808:	48 83 ff 01          	cmp    $0x1,%rdi
      40080c:	75 f2                	jne    400800 <fact_tr_aux+0x10> /* recursion discard */
      40080e:	f3 c3                	repz retq

递归不见了，被优化为循环了。从上面的试验结果，得到下面一些浅显的看法。

- 打开优化选项`~-O1 -foptimize-sibling-calls~`  或 `~-O2~`后，gcc会对尾递归优化。
- 尾递归被优化的前提是递归函数不使用栈来记录变量，也不记录状态。第一例没有被
  优化就是因为n的地址依赖函数栈。
- 尾递归被优化的本质是它的上下文不是保存在栈上，与调用者无关，这样就可以重用
  当前的栈帧。上面的例子就是使用函数参数来记录上下文。
- 尾递归是函数式编程的特性，也容易转换成循环，在C语言中似乎没有什么理由用它。

如果发现任何谬误，请告诉我☺

* * * * *
更新一网友的回复：

    ret_type foo (type para1, type para2)
    {
         if (cond)
            return (no_cal_expr);
    
        stat1;
        stat2;
        ...
        statn;
    
        foo(argu1, argu2);
    }
	
优化后就是下面的形式：
	
    ret_type foo(type para1, type para2)
    {
    start:
        if (cond)
            return (no_cal_expr);
        stat1;
        stat2;
        ...
        statn;
    
        para1 = argu1, para2 = argu2;
        goto start;
    }

每次跳转循环后，只能函数参数变化了。清晰的展示了优化后的效果。

~EOF~ {% include post_date.span %}
