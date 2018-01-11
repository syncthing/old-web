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
    nextReleaseAt = nextMonthTuesday(latestRelease.created_at);

    if (latestPre.created_at > latestRelease.created_at) {
        // We have a pre-release out for the next version. That's what's
        // going to get released.
        nextReleaseVer = latestPre.tag_name.replace(/-rc.+/, '');
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
    $("#latest-release-link").attr("href", res.latestRelease.html_url);

    $("#next-release-tag").html(res.nextReleaseVer);
    $("#next-release-date").html(datefmt(res.nextReleaseAt));
}

function nextMonthTuesday(d) {
    d = new Date(d.getTime());
    d.setDate(1)
    d.setMonth(d.getMonth() + 1)
    var days = 2 - d.getDay()
    if (days > 0) {
        d.setDate(d.getDate() + days)
    } else if (days < 0) {
        d.setDate(d.getDate() + days + 7)
    }
    return d
}

function datefmt(d) {
    return d.toISOString().substr(0, 10);
}
