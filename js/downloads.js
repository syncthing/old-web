
function appendDownloadLinks(data, tag) {
    var links = {};
    $.each(data.assets, function(i, asset) {
        var m = asset.name.match(/syncthing-(\w+)-(\w+)/);
        if (!m) {
            return
        }

        var os = m[1];
        var arch = m[2];
        var order = 'Y'; // used for sorting

        if (os === 'linux') {
            os = 'Linux';
            order = 'A';
        } else if (os === 'windows') {
            os = 'Windows';
            order = 'B';
        } else if (os === 'macosx') {
            os = 'Mac OS X';
            order = 'C';
        } else if (os === 'freebsd') {
            os = 'FreeBSD';
            order = 'D';
        } else if (os === 'solaris') {
            os = 'Solaris';
            order = 'E';
        } else if (os === 'netbsd') {
            os = 'NetBSD';
            order = 'F'
        } else if (os === 'openbsd') {
            os = 'OpenBSD';
            order = 'F'
        } else if (os === 'dragonfly') {
            os = 'Dragonfly BSD';
            order = 'F'
        } else if (os === 'source') {
            os = 'Source Code';
            arch = data.tag_name;
            order = 'Z';
        }

        if (arch === 'amd64') {
            arch = '64 bit';
        } else if (arch === '386') {
            arch = '32 bit';
        } else if (arch === 'arm') {
            arch = 'ARM';
        }

        var l = links[order + os];
        if (!l) {
            l = [];
        }
        l.push('<a href="' + asset.browser_download_url + '">' + arch + '</a>');
        links[order + os] = l;
    });

    var keys = Object.keys(links);
    keys.sort();

    var items = [];
    for (var i = 0; i < keys.length; i++) {
        var os = keys[i].substr(1);
        items.push('<li>' + os + ': ' + links[keys[i]].join(', ')) + '</li>';
    }

    $("<ul/>", {
        "class": "my-new-list",
        html: items.join("")
    }).appendTo(tag);
}