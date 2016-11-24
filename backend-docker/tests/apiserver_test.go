package tests

import (
	"testing"
	"github.com/EUDAT-GEF/GEF/backend-docker/config"
	"github.com/EUDAT-GEF/GEF/backend-docker/server"
	//"github.com/EUDAT-GEF/GEF/backend-docker/dckr"
	"net/http/httptest"
	"net/http"
	"encoding/json"

	"log"
	"io/ioutil"
)

type VolList struct {
	Volumes1 map[string]string
}

func getJson(callURL string, target interface{}) error {
	request, err := http.NewRequest("GET", callURL, nil)
	res, err := http.DefaultClient.Do(request)

	//r, err := http.Get(callURL)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	return json.NewDecoder(res.Body).Decode(target)
}

func isJSON(s string) bool {
	var js map[string]interface{}
	return json.Unmarshal([]byte(s), &js) == nil
}

func TestServer(t *testing.T) {
	settings, err := config.ReadConfigFile(configFilePath)
	if err != nil {
		t.Error("FATAL while reading config files: ", err)
	}
	clientConf = settings.Docker

	c := newClient(t)
	s := server.NewServer(settings.Server, c)

	srv := httptest.NewServer(s.Server.Handler)
	baseURL := srv.URL + "/api/"
	ifAPIExist(baseURL, t)
	callListVolumesHandler(baseURL + "volumes", t)






}

func ifAPIExist(callURL string, t *testing.T) bool {
	request, err := http.NewRequest("GET", callURL, nil)
	if err != nil {
		t.Error(err)
	}
	res, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Error(err)
	}

	if res.StatusCode != 200 {
		t.Error("Error code: ", res.StatusCode)
		t.Fail()
		return false
	} else {
		return true
	}
}

func callListVolumesHandler(callURL string,  t *testing.T) {
	request, err := http.NewRequest("GET", callURL, nil)
	if err != nil {
		t.Error(err)
	}

	res, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Error(err)
	}

	defer res.Body.Close()
	if res.StatusCode != 200 {
		t.Error("Error code: ", res.StatusCode)
		t.Fail()
	} else {
		htmlData, err := ioutil.ReadAll(res.Body)
		if err != nil {
			t.Error("Cannot read response body: ", err)
			t.Fail()
		}
		correctReply := isJSON(string(htmlData))

		if correctReply != true {
			t.Error("Reply is not JSON")
			t.Fail()
		}

		c := make(map[string]interface{})
		err = json.Unmarshal(htmlData, &c)
		if err != nil {
			t.Error("Error while reading JSON: ", err)
			t.Fail()
		}

		// a string slice to hold the keys
		k := make([]string, len(c))
		i := 0
		// copy c's keys into k
		for s, _ := range c {
			k[i] = s
			i++
		}
		log.Println(k[0])

		// the only found key should look like this
		if k[0] != "Volumes" {
			t.Error("Reply is not correct")
			t.Fail()
		}
	}
}
