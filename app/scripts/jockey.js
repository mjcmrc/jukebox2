var do_search, init_path, loading, notification, notification_turn, query, realtime, search_timer, searching, set_hooks;
searching = !!(location.pathname.match(/^\/search/));
notification = false;
init_path = location.pathname;
query = null;

$(document).ready(function() {
	$(document).pjax('[data-pjax] a, a[data-pjax]', '#content')
    /*$("a[data-pjax]").filter(function() {
        return !($(this).data('pjaxed'));
    }).each(function() {
		console.log($(this) + " pjax");
        $(this).data('pjaxed', true);
        return $(this).pjax("#content");
	});*/

    $('a.enque').click(function(e) {
        console.log("enque song " + $(this).data('song'));
        var link;
        link = $(this);
		$.post('/api/enque', {
            id: $(this).data('song')
        }, function(data) {
            console.log("hello");
            console.log(data);
			
            if (data.done == false) {
                console.log("omg no!?!");
                switch (data.code) {
                    case 123:
                        alert('This song is already queued! Please choose another :(');
						break;
                }
            } else {
                var msg = prompt("Your dedication (140 characters max.)", "");
                if (msg != null) {
					console.log(this);
                    console.log("the msg " + msg);
                    $.post('/api/dedicate', {
                        id: link.data('song'),
                        message: msg
                    }, function(data) {
                        console.log("dedicate pls");
                        console.log(data);
                    });
                }
            }
            $(link).text("✔").attr('href', null);
			//alert('hi');
        });
		e.preventDefault();
		e.stopImmediatePropagation();
    });

    loading = function(f) {
        if (f) {
            console.log("Loading");
            return $("h1").text("Loading");
        } else {
            console.log("Loaded");
            return $("h1").text("Jockey");
        }
    };
    set_hooks = function() {
        /*if (!searching) {
            $("#search_box").val('');
        }
        return loading(false);*/
    };

    realtime = new EventSource("/api/realtime?html=1");
    $(realtime).bind('playing', function(e) {
        var f, json, n;
        json = JSON.parse(e.originalEvent.data);
        $("#playing").html(json.html);
        $("#playing a[data-pjax]").pjax();
        if (notification) {
            n = window.webkitNotifications.createNotification($("#playing .artwork img").attr('src'), $("#playing .song_name").text(), $("#playing .song_artist").text());
            f = function() {
                return n.cancel();
            };
            n.ondisplay = function() {
                return setTimeout(f, 2000);
            };
            return n.show();
        }
    });
	$(realtime).bind('dedicate', function(e) {
		var json = JSON.parse(e.originalEvent.data);
		console.log("dedicate wow");
	});
    $(realtime).bind('upcoming', function(e) {
        var json;
        json = JSON.parse(e.originalEvent.data);
        console.log("upcoming " + json.html);
        /*if (searching) {
          return;
        }*/
        console.log("wow");
        /*if (location.pathname !== "/") {
          return;
        }*/
        $("#potato").html(json.html);
        return set_hooks();
    });
    $(realtime).bind('history', function(e) {
        var json;
        json = JSON.parse(e.originalEvent.data);
        if (searching) {
            return;
        }
        if (location.pathname !== "/history") {
            return;
        }
        $("#content").html(json.html);
        return set_hooks();
    });
    if (window.webkitNotifications) {
        $(".notification").show();
        notification_turn = function(flag) {
            if (flag) {
                if (window.webkitNotifications.checkPermission() === 0) {
                    $(".notification img").attr('src', '/images/notification_on.svg');
                    window.localStorage.jockify = "true";
                    return notification = true;
                } else {
                    return window.webkitNotifications.requestPermission(function() {
                        if (window.webkitNotifications.checkPermission() === 0) {
                            return notification_turn(true);
                        }
                    });
                }
            } else {
                $(".notification img").attr('src', '/images/notification_off.svg');
                window.localStorage.jockify = "false";
                return notification = false;
            }
        };
        if (window.localStorage.jockify === "true") {
            notification_turn(true);
        }
        $(".notification img").click(function(e) {
            e.preventDefault();
            return notification_turn(!notification);
        });
    }
    do_search = function() {
        if ($("#search_box").val().length === 0 && searching) {
            searching = false;
            history.back();
            return;
        }
        if (query === $("#search_box").val()) {
            return;
        }
        query = $("#search_box").val();
        if (query.length < 2) {
            return;
        }
        return $.pjax({
            url: "/search?q=" + (encodeURIComponent(query)),
            container: '#content',
            timeout: 60000,
            push: !searching,
            replace: searching,
            success: function() {
                return searching = true;
            }
        });
    };
    $("#search_form").submit(function(e) {
        e.preventDefault();
        return $("#search_box").blur();
    });
    search_timer = null;
    $("#search_box").keyup(function(e) {
        if (e.keycode !== 13) {
            if (search_timer) {
                clearTimeout(search_timer);
            }
            return search_timer = setTimeout(do_search, 500);
        }
    });
    $(document).bind('pjax:start', function() {
        return loading(true);
    });
    $(document).bind('pjax:success', function() {
        searching = !!(location.pathname.match(/^\/search/));
        loading(false);
        return set_hooks();
    });
    return $(window).bind('pjax:popstate', function(e) {
        var path;
        path = e.state.url.replace(location.origin, '');
        searching = !!(location.pathname.match(/^\/search/));
        switch (path) {
            case "/":
                $("#content").load('/?no_layout=1', set_hooks);
                return searching = false;
            case "/history":
                $("#content").load('/history?no_layout=1', set_hooks);
                return searching = false;
        }
    });
});
