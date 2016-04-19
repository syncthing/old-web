package main

import (
	"bytes"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
)

type handler struct {
	cfg      config
	repos    map[string]repo
	reposMut sync.RWMutex
}

func (h *handler) Serve() {
	h.repos = make(map[string]repo)
	for {
		h.reposMut.Lock()
		for _, repo := range getAllRepositories(h.cfg) {
			key := strings.ToLower(strings.Replace(path.Base(repo.GithubName), "-", "", -1))
			h.repos[key] = repo
		}
		h.reposMut.Unlock()
		time.Sleep(time.Hour)
	}
}

func (h *handler) handle(w http.ResponseWriter, req *http.Request) {
	path := req.URL.Path

	// Check for the presence of the file in static/, and if so just serve
	// it directly.
	static := filepath.Join("static", path)
	if _, err := os.Stat(static); err == nil {
		http.ServeFile(w, req, static)
		return
	}

	// Process it as a template instead
	tpl := filepath.Join("templates", path)
	if _, err := os.Stat(tpl); err == nil {
		t, err := template.New(filepath.Base(tpl)).ParseFiles(tpl)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		buf := new(bytes.Buffer)

		h.reposMut.RLock()
		err = t.Execute(buf, h.repos)
		h.reposMut.RUnlock()

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		switch filepath.Ext(path) {
		case ".css":
			w.Header().Set("Content-Type", "text/css")
		case ".html":
			w.Header().Set("Content-Type", "text/html")
		default:
			w.Header().Set("Content-Type", http.DetectContentType(buf.Bytes()))
		}

		w.Write(buf.Bytes())
		return
	}

	http.NotFound(w, req)
}

func getAllRepositories(cfg config) []repo {
	var rs []repo
	for _, rc := range cfg.Repos {
		r, err := getRepository(rc)
		if err != nil {
			log.Printf("Getting %s: %v", rc.GithubName, err)
			continue
		}
		rs = append(rs, r)
	}

	return rs
}

func getRepository(rc repoCfg) (repo, error) {
	gr, err := getRepo(rc.GithubName)
	if err != nil {
		return repo{}, err
	}

	rs, err := gr.getReleases(5) // At most five releases per repo
	if err != nil {
		return repo{}, err
	}

	r := repo{
		FriendlyName: rc.FriendlyName,
		GithubName:   gr.FullName,
		CssName:      strings.ToLower(strings.Replace(rc.FriendlyName, " ", "-", -1)),
		IsSyncthing:  strings.Compare(rc.FriendlyName, "Syncthing") == 0,
		Description:  gr.Description,
		GithubURL:    gr.URL,
	}

	for _, rel := range rs {
		if rel.Prerelease {
			continue
		}
		ver := version{
			Version:   rel.Tag,
			CreatedAt: rel.CreatedAt,
		}
		for _, as := range rel.Assets {
			ast := asset{
				URL: as.URL,
			}

			if val, err := extractExpr(rc.NameExpr, as.Name); err != nil {
				log.Printf("%s %s: %v (skipping)", rc.GithubName, rel.Tag, err)
				continue
			} else {
				ast.Name = val
			}

			if val, err := extractExpr(rc.OSExpr, as.Name); err != nil {
				log.Printf("%s %s: %v (skipping)", rc.GithubName, rel.Tag, err)
				continue
			} else {
				ast.OS = val
			}

			if val, err := extractExpr(rc.ArchExpr, as.Name); err != nil {
				log.Printf("%s %s: %v (skipping)", rc.GithubName, rel.Tag, err)
				continue
			} else {
				ast.Arch = val
			}

			ver.Assets = append(ver.Assets, ast)
		}
		if len(ver.Assets) > 0 {
			r.Versions = append(r.Versions, ver)
		}
	}

	return r, nil
}

func generateOverview(repos []repo) ([]byte, error) {
	fm := template.FuncMap{
		"now": time.Now,
	}
	tmpl := template.Must(template.New("index.go.html").Funcs(fm).ParseGlob("*.go.html"))

	buf := new(bytes.Buffer)
	if err := tmpl.Execute(buf, repos); err != nil {
		log.Printf("Template execution: %s", err)
		return nil, err
	}

	return buf.Bytes(), nil
}

func extractExpr(expr, val string) (string, error) {
	if !strings.HasPrefix(expr, "/") {
		return expr, nil
	}

	re, err := regexp.Compile(expr[1 : len(expr)-1])
	if err != nil {
		return "", err
	}

	ms := re.FindStringSubmatch(val)
	if len(ms) != 2 {
		return "", fmt.Errorf("%s doesn't match %q", expr, val)
	}

	return ms[1], nil
}
