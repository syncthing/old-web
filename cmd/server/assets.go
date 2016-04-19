package main

import (
	"fmt"
	"sort"
	"strings"
	"time"
)

type repo struct {
	GithubName   string
	FriendlyName string
	CssName      string
	IsSyncthing  bool
	Description  string
	GithubURL    string
	Versions     []version
}

func (r repo) HasLatestVersion() bool {
	return len(r.Versions) > 0
}

func (r repo) LatestVersion() version {
	return r.Versions[0]
}

func (r repo) HasOlderVersions() bool {
	return len(r.Versions) > 1
}

func (r repo) OlderVersions() []version {
	return r.Versions[1:]
}

// A given release version.
type version struct {
	Version   string
	CreatedAt time.Time
	Assets    []asset
}

func (v version) FriendlyName() string {
	if strings.HasPrefix(v.Version, "v") {
		return v.Version[1:]
	}
	return v.Version
}

func (v version) SortedAssets() []asset {
	sort.Sort(assetList(v.Assets))
	return v.Assets
}

func (v version) ReleaseDate() string {
	return v.CreatedAt.Format("2006-01-02")
}

// A download, for a given repo, version, OS and architecture
type asset struct {
	URL  string
	Name string
	OS   string
	Arch string
}

type assetList []asset

func (l assetList) Len() int {
	return len(l)
}

func (l assetList) Less(a, b int) bool {
	return l[a].FriendlyName() < l[b].FriendlyName()
}

func (l assetList) Swap(a, b int) {
	l[a], l[b] = l[b], l[a]
}

func (a asset) FriendlyName() string {
	var os string
	switch a.OS {
	case "linux":
		os = "Linux"
	case "windows":
		os = "Windows"
	case "darwin", "macosx":
		os = "Mac OS X"
	case "dragonfly":
		os = "Dragonfly BSD"
	case "freebsd":
		os = "FreeBSD"
	case "netbsd":
		os = "NetBSD"
	case "openbsd":
		os = "OpenBSD"
	case "solaris":
		os = "Solaris/Illumos/SmartOS"
	default:
		os = a.OS
	}

	var arch string
	switch a.Arch {
	case "386", "x86":
		arch = "32 bit"
	case "amd64", "x64":
		arch = "64 bit"
	case "arm":
		arch = "ARM 32-bit"
	case "arm64":
		arch = "ARM 64 bit"
	default:
		arch = a.Arch
	}

	return fmt.Sprintf("%s for %s (%s)", a.Name, os, arch)
}
