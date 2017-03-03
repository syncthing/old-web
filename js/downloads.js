$.getJSON('https://upgrades.syncthing.net/meta.json', function(data) {
    var latestPre, latestRelease;
    for (var i = 0; i < data.length; i++) {
        var release = data[i];
        release.created_at = new Date(release.created_at)

        if (!latestPre && release.prerelease) {
            latestPre = release;
        }

        if (!latestRelease && !release.prerelease) {
            latestRelease = release;
        }

        if (latestPre && latestRelease) {
            break;
        }
    }

    if (!latestPre || !latestRelease) {
        return
    }

    $("#latest-pre-tag").html(latestPre.tag_name);
    $("#latest-pre-date").html(datefmt(latestPre.created_at));
    $("#latest-pre-link").attr("href", latestPre.html_url);

    $("#latest-release-tag").html(latestRelease.tag_name);
    $("#latest-release-date").html(datefmt(latestRelease.created_at));

    if (/-rc.1$/.exec(latestPre.tag_name)) {
        nextReleaseAt = tuesday(addDays(latestPre.created_at, 14));
    } else {
        nextReleaseAt = tuesday(addDays(latestPre.created_at, 7));
    }

    var nextReleaseVer = latestPre.tag_name.replace(/-rc.+/, '');

    $("#next-release-tag").html(nextReleaseVer);
    $("#next-release-date").html(datefmt(nextReleaseAt));

    appendDownloadLinks(latestRelease, '#download-links')

    $('#dynamic-downloads').css('display', 'block');
    $('#static-download').hide();
});

function tuesday(d) {
    d.setDate(d.getDate() + 2 - d.getDay());
    return d
}

function addDays(d, days) {
    d.setDate(d.getDate() + days);
    return d
}

function datefmt(d) {
    return d.toISOString().substr(0, 10);
}

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