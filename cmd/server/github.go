package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

// The types in this file are the ones returned by the Github API. We
// convert these to internal types that better fit our use case - see
// assets.go.

// A Github repository
type githubRepo struct {
	Name        string
	FullName    string `json:"full_name"`
	Description string
	URL         string `json:"html_url"`
	ReleasesURL string `json:"releases_url"`
}

// getRepo returns a Github repository, given it's name like
// "syncthing/syncthing".
func getRepo(name string) (githubRepo, error) {
	req := newGetReq(fmt.Sprintf("https://api.github.com/repos/%s", name))
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return githubRepo{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return githubRepo{}, errors.New(resp.Status)
	}

	var r githubRepo
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return githubRepo{}, err
	}

	return r, nil
}

// getReleases returns the list of releases for a given repo, up to n of
// them.
func (r githubRepo) getReleases(n int) ([]githubRelease, error) {
	url := strings.Replace(r.ReleasesURL, "{/id}", "", 1)
	req := newGetReq(fmt.Sprintf("%s?per_page=%d", url, n))
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, errors.New(resp.Status)
	}

	var rs []githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&rs); err != nil {
		return nil, err
	}

	return rs, nil
}

// A Github release (i.e. a specific tag on a repository).
type githubRelease struct {
	Name       string
	Tag        string `json:"tag_name"`
	Assets     []githubAsset
	Prerelease bool
	CreatedAt  time.Time `json:"created_at"`
}

// A Github release asset (i.e. a specific file within a release).
type githubAsset struct {
	URL   string `json:"browser_download_url"`
	Name  string
	Label string
}

func newGetReq(url string) *http.Request {
	req, _ := http.NewRequest("GET", url, nil)

	user := os.Getenv("GITHUB_USERNAME")
	token := os.Getenv("GITHUB_TOKEN")
	if user != "" && token != "" {
		req.SetBasicAuth(user, token)
	}

	return req
}
