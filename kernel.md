---
layout: default
title: 那一颗花生
---

<ul class="post">
  {% for post in site.categories.kernel %}
  <li>
    <a href="{{ post.url }}">{{ post.title}}</a>
    <span class="date" cate="{{ post.categories }}">
    {{ post.date | date:"%Y-%m-%d" }}</span>
  </li>
  {% endfor %}
</ul>
