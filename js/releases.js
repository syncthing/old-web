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

    if (!latestRelease) {
        return
    }

    // Predict the next release based on the previous one.

    var nextReleaseAt, nextReleaseVer;
    var parts = latestRelease.tag_name.split(".");
    parts[2] = +parts[2] + 1;
    nextReleaseVer = parts.join(".");
    nextReleaseAt = tuesday(addDays(latestRelease.created_at, 14));

    if (latestPre.created_at > latestRelease.created_at) {
        // We have a pre-release out for the next version. See if that
        // delays the release.
        nextReleaseVer = latestPre.tag_name.replace(/-rc.+/, '');
        var maybeNextReleaseAt = tuesday(addDays(latestPre.created_at, 7));
        if (maybeNextReleaseAt > nextReleaseAt) {
            nextReleaseAt = maybeNextReleaseAt;
        }
    } else {
        // The release is newer than the release candidate, so we don't
        // currently have a release candidate out.
        latestPre = undefined
    }

    return {
        latestRelease: latestRelease,
        latestPre: latestPre,
        nextReleaseVer: nextReleaseVer,
        nextReleaseAt: nextReleaseAt,
    }
}

function setTags(res) {
    if (res.latestPre) {
        $("#latest-pre-tag").html(res.latestPre.tag_name);
        $("#latest-pre-date").html(datefmt(res.latestPre.created_at));
        $("#latest-pre-link").attr("href", res.latestPre.html_url);
        $("#latest-pre-span").css("display", "inline");
    } else {
        $("#latest-pre-span").css("display", "none");
    }

    $("#latest-release-tag").html(res.latestRelease.tag_name);
    $("#latest-release-date").html(datefmt(res.latestRelease.created_at));

    $("#next-release-tag").html(res.nextReleaseVer);
    $("#next-release-date").html(datefmt(res.nextReleaseAt));
}

function tuesday(d) {
    d = new Date(d.getTime());
    d.setDate(d.getDate() + 2 - d.getDay());
    return d
}

function addDays(d, days) {
    d = new Date(d.getTime());
    d.setDate(d.getDate() + days);
    return d
}

function datefmt(d) {
    return d.toISOString().substr(0, 10);
}
