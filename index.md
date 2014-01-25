---
layout: default
title: 那一颗花生
keywords: [程序员, kernel, gentoo, 内核]
description: 一个程序员的博客
---

<ul class="post">
  {% for post in site.posts %}
  <li>
    <a href="{{ post.url }}">{{ post.title}}</a>
    <span class="date">
    {{ post.date | date:"%Y-%m-%d" }}</span>
  </li>
  {% endfor %}
</ul>
