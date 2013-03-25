// lightview
(function ($) {
    $("#article a").has("img").addClass("lightview a_img");
})(jQuery);

// open external link with new window
$(document).ready(function() {
    $("a[href*='http://']:not([href*='"+location.hostname+"']),[href*='https://']:not([href*='"+location.hostname+"'])");
    $("a[href*='http://']:not([href*='"+location.hostname+"']),[href*='https://']:not([href*='"+location.hostname+"'])")
	.addClass("external");
    $("a[href*='http://']:not([href*='"+location.hostname+"']),[href*='https://']:not([href*='"+location.hostname+"'])")
	.addClass("external")
	.attr("target","_blank");

});

