function loadMilestones() {
    $.getJSON('https://api.github.com/repos/syncthing/syncthing/milestones',function (data) {
        var nextMilestone;
        for (var i = 0; i < data.length; i++) {
            var milestone = data[i];
            milestone.due_on = new Date(milestone.due_on);
            if (!nextMilestone || milestone.due_on < nextMilestone.due_on) {
                nextMilestone = milestone;
            }
        }
        if (nextMilestone) {
            showNextRelease(nextMilestone);
        }
    });
}

function showNextRelease(res) {
    $("#next-release-tag").html(res.title);
    $("#next-release-date").html(datefmt(res.due_on));
}

function parseReleases(data) {
    var latestPre, latestRelease;
    for (var i = 0; i < data.length; i++) {
        var release = data[i];

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

    // Quick and dirty version comparison... Will usually be mostly right.
    if (latestPre && latestPre.tag_name < latestRelease.tag_name) {
        // The release is newer than the release candidate, so we don't
        // currently have a release candidate out.
        latestPre = undefined
    }

    return {
        latestRelease: latestRelease,
        latestPre: latestPre,
    }
}

function setTags(res) {
    if (res.latestPre) {
        $("#latest-pre-tag").html(res.latestPre.tag_name);
        $("#latest-pre-link").attr("href", res.latestPre.html_url);
        $("#latest-pre-span").css("display", "inline");
    } else {
        $("#latest-pre-span").css("display", "none");
    }

    $("#latest-release-tag").html(res.latestRelease.tag_name);
    $("#latest-release-link").attr("href", res.latestRelease.html_url);
}

function nextMonthTuesday(d) {
    d = new Date(d.getTime());
    d.setDate(1)
    d.setMonth(d.getMonth() + 1)
    return nextTuesday(d);
}

function nextTuesday(d) {
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
