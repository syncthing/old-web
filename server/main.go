package main

import (
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"os"
	"time"
)

type config struct {
	ListenAddr        string
	RepoCacheTime     time.Duration // How long to cache Github responses
	TemplateCacheTime time.Duration // How long to cache template evaluation
	Repos             []repoCfg
}

type repoCfg struct {
	FriendlyName string
	GithubName   string
	NameExpr     string
	ArchExpr     string
	OSExpr       string
}

func main() {
	log.SetOutput(os.Stdout)
	log.SetFlags(0)

	cfgFile := flag.String("cfg", "config.json", "Name of configuration file")
	flag.Parse()

	fd, err := os.Open(*cfgFile)
	if err != nil {
		log.Fatal("Reading config:", err)
	}

	var cfg config
	if err := json.NewDecoder(fd).Decode(&cfg); err != nil {
		log.Fatal("Reading config:", err)
	}

	fd.Close()

	log.Println("Repositories:")
	for _, repo := range cfg.Repos {
		log.Printf("  %s (%s)", repo.FriendlyName, repo.GithubName)
	}
	log.Println("Caching Github data for", cfg.RepoCacheTime)
	log.Println("Caching template evaluations for", cfg.TemplateCacheTime)
	log.Println("Listening on", cfg.ListenAddr)

	h := &handler{
		cfg: cfg,
	}
	go h.Serve()

	http.HandleFunc("/", h.handle)
	log.Fatal(http.ListenAndServe(cfg.ListenAddr, nil))
}
