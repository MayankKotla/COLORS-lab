// A stand-in for XMLHttpRequest so the tests can see exactly what code.js
// sends to the LAMPAPI endpoints, and then hand back a response in the same
// JSON shape the PHP scripts return.
//
// Why not call the real PHP API? The LAMPAPI folder (with the database
// password) is deliberately kept out of this public repo, so CI has no PHP
// server to talk to. Instead, the responses come from tests/fixtures/*.json,
// which mirror the documented API contract in docs/uml/class.puml.
class FakeXHR {
  constructor() {
    this.readyState = 0;
    this.status = 0;
    this.responseText = "";
    this.requestHeaders = {};
    this.onreadystatechange = null;
    FakeXHR.instances.push(this);
  }

  open(method, url, async) {
    this.method = method;
    this.url = url;
    this.async = async;
    this.readyState = 1;
  }

  setRequestHeader(name, value) {
    this.requestHeaders[name] = value;
  }

  send(body) {
    this.body = body;
  }

  // Test helper: the request body code.js sent, parsed back into an object.
  sentJson() {
    return JSON.parse(this.body);
  }

  // Test helper: simulate the server answering with HTTP `status` and a
  // JSON body, then fire the handler code.js registered.
  respond(status, payload) {
    this.status = status;
    this.readyState = 4;
    this.responseText =
      typeof payload === "string" ? payload : JSON.stringify(payload);
    if (this.onreadystatechange) {
      this.onreadystatechange.call(this);
    }
  }
}

FakeXHR.instances = [];

// Swap the browser's XMLHttpRequest for the fake one. Returns the class so a
// test can read FakeXHR.instances to find the request that was made.
function installFakeXhr() {
  FakeXHR.instances = [];
  window.XMLHttpRequest = FakeXHR;
  return FakeXHR;
}

// The most recent request code.js opened.
function lastRequest() {
  return FakeXHR.instances[FakeXHR.instances.length - 1];
}

module.exports = { installFakeXhr, lastRequest };
