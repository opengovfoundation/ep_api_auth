# API Authentication for Etherpad

Connects to our existing API, passing any cookies it receives, and checks for a 200 response.

## Configuration

After installing, you'll need to set your API's info in the main Etherpad `settings.json` as follows:

```
  //Our API
  "ep_api_auth": {
    "host": "myapi.example.com",
    "path": "/api/docs/{token}",
  },
```

Available configuration options are:

* host: The hostname or IP of the API. **Required.**
* path: The path to the resource that should be checked. `{token}` is replaced with the pad's unique id/slug. **Required.**
* protocol: What protocol to use to contact the API.  Defaults to `http`.  `https` is allowed.
* port: What port to use to contact the API.  Defaults to `80`.
* method: What HTTP method to use to contact the API.  Defaults to `GET`.
