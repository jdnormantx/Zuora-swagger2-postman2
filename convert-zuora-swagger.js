const fs = require("fs");
const refParser = require("json-schema-ref-parser");
const swagger2Postman = require("./index.js");

    
var specURL = "https://assets.zuora.com/zuora-documentation/swagger3.yaml";

console.log(`Downloading Swagger spec...`);
refParser.dereference(specURL, {}, (err, spec) => {
  
  if (err) {
    console.error("ERROR: Cannot dereference Swagger spec");
    return;
  }
  
  var specVersion = spec.info.version;
  console.log(`Swagger spec version is ${specVersion}`);
  
  // Prepare the Swagger spec
  delete spec.definitions;
  spec.info.title = `Zuora REST API (${specVersion})`;
  spec.info.description = `See https://www.zuora.com/developer/api-reference/ for the latest REST API documentation

This collection was generated using https://github.com/davidwzuora/swagger2-postman2`;
  spec.host = "{{zuora_host}}";
  
  // Convert the Swagger spec
  console.log("Converting Swagger spec to a Postman collection...");
  var collection = swagger2Postman.convert(spec).collection;
  
  // Define a variable for the host
  collection.variables = [{
    key: "zuora_host",
    value: "rest.apisandbox.zuora.com",
    type: "string"
  },
  {
    key: "zuora_host_SNA1",
    value: "rest.sandbox.na.zuora.com",
    type: "string"
  },
                         {
    key: "zuora_host_SNA2",
    value: "rest.apisandbox.zuora.com",
    type: "string"
  },
                          {
    key: "zuora_host_SEU",
    value: "rest.sandbox.eu.zuora.com",
    type: "string"
  },
                          {
    key: "zuora_host_PNA1",
    value: "rest.na.zuora.com",
    type: "string"
  },
                          {
    key: "zuora_host_PNA2",
    value: "rest.apisandbox.zuora.com",
    type: "string"
  },
                          {
    key: "zuora_host_PEU",
    value: "rest.eu.zuora.com",
    type: "string"
  }  ];
  
  // Set the authorization method to Bearer Token
  collection.auth = {
    type: "bearer",
    bearer: [{
      key: "token",
      value: "{{bearer_token}}",
      type: "string"
    }]
  };
  
  // Modify POST /oauth/token
  collection.item.forEach(item => {
    if (
      item.hasOwnProperty("request") &&
      item.request.method == "POST" &&
      item.request.url.path.length == 2 &&
      item.request.url.path[0] == "oauth" &&
      item.request.url.path[1] == "token"
    ) {
      // Don't use Bearer Token authorization
      item.request.auth = {
        type: "noauth"
      };
      // Define a test script that saves the generated token
      item.event = [{
        listen: "test",
        script: {
          type: "text/javascript",
          exec: [
            "tests[\"OAuth token generated\"] = (",
            "  responseCode.code === 200 &&",
            "  JSON.parse(responseBody).hasOwnProperty(\"access_token\")",
            ");",
            "",
            "if (tests[\"OAuth token generated\"]) {",
            "  var body = JSON.parse(responseBody);",
            "  postman.setEnvironmentVariable(\"bearer_token\", body.access_token);",
            "}"
          ]
        }
      }];
    }
  });
  
  // Save the Postman collection
  var postmanFilename = `zuora-postman-${specVersion}-v3.json`;
  var postmanJSON = JSON.stringify(collection, null, 2);
  fs.writeFileSync(postmanFilename, postmanJSON, "utf8");
  console.log(`Saved Postman collection as ${postmanFilename}`);
  
});
