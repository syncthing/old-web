function parseReleases(data) {
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

    if (/-rc.1$/.exec(latestPre.tag_name)) {
        nextReleaseAt = tuesday(addDays(latestPre.created_at, 14));
    } else {
        nextReleaseAt = tuesday(addDays(latestPre.created_at, 7));
    }

    var nextReleaseVer = latestPre.tag_name.replace(/-rc.+/, '');

    return {
        latestRelease: latestRelease,
        latestPre: latestPre,
        nextReleaseVer: nextReleaseVer,
        nextReleaseAt: nextReleaseAt,
    }
}

function setTags(res) {
    $("#latest-pre-tag").html(res.latestPre.tag_name);
    $("#latest-pre-date").html(datefmt(res.latestPre.created_at));
    $("#latest-pre-link").attr("href", res.latestPre.html_url);

    $("#latest-release-tag").html(res.latestRelease.tag_name);
    $("#latest-release-date").html(datefmt(res.latestRelease.created_at));

    $("#next-release-tag").html(res.nextReleaseVer);
    $("#next-release-date").html(datefmt(res.nextReleaseAt));
}

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
