'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * simple ajax handler
 **/

//ADD sendAsBinary compatibilty to older browsers
if (XMLHttpRequest.prototype.sendAsBinary === undefined) {
  XMLHttpRequest.prototype.sendAsBinary = function (string) {
    var bytes = Array.prototype.map.call(string, function (c) {
      return c.charCodeAt(0) & 0xff;
    });
    this.send(new Uint8Array(bytes).buffer);
  };
}

module.exports = function (method, url, headers, data, callback, err, isBinary, withCredentials) {

  var r = new XMLHttpRequest();
  var error = err || function () {
    console.error('AJAX ERROR!');
  };
  var boundary = 'webcodeimageupload';
  // Binary?
  var binary = false;
  if (method === 'blob') {
    binary = method;
    method = 'GET';
  }
  method = method.toUpperCase();
  // Xhr.responseType 'json' is not supported in any of the vendors yet.
  r.onload = function () {
    var json = r.response;
    try {
      json = JSON.parse(r.responseText);
    } catch (_e) {
      if (r.status === 401) {
        json = error('access_denied', r.statusText);
      }
    }
    var headers = headersToJSON(r.getAllResponseHeaders());
    headers.statusCode = r.status;
    callback(json || (method === 'GET' ? error('empty_response', 'Could not get resource') : {}), headers);
  };
  r.onerror = function () {
    var json = r.responseText;
    try {
      json = JSON.parse(r.responseText);
    } catch (_e) {
      console.error(_e);
    }
    callback(json || error('access_denied', 'Could not get resource'));
  };
  var x = void 0;
  // Should we add the query to the URL?
  if (method === 'GET' || method === 'DELETE') {
    data = null;
  } else if (isBinary) {
    var keyData = data;
    var code = data.base64Code.replace('data:' + data.type + ';base64,', '');
    data = ['--' + boundary, 'Content-Disposition: form-data; name="' + data.filed + '"; filename="' + data.filename + '"', 'Content-Type: ' + data.type, '', window.atob(code), ''].join('\r\n');
    var keyArr = Object.keys(keyData);
    if (keyArr.length > 4) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = keyArr[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var k = _step.value;

          if (['filed', 'filename', 'type', 'base64Code'].indexOf(k) == -1) {
            data += ['--' + boundary, 'Content-Disposition: form-data; name="' + k + '";', '', ''].join('\r\n');
            data += [_typeof(keyData[k]) === 'object' ? JSON.stringify(keyData[k]) : encodeURI(keyData[k]), ''].join('\r\n');
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
    data += '--' + boundary + '--';
  }
  // Open the path, async
  r.open(method, url, true);
  if (binary) {
    if ('responseType' in r) {
      r.responseType = binary;
    } else {
      r.overrideMimeType('text/plain; charset=x-user-defined');
    }
  }
  // Set any bespoke headers
  if (headers) {
    for (x in headers) {
      r.setRequestHeader(x, headers[x]);
    }
  }
  r.withCredentials = typeof withCredentials === 'undefined' ? true : withCredentials;
  if (isBinary) {
    r.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
    return r.sendAsBinary(data);
  }

  r.send(data);
  return r;
  // Headers are returned as a string
  function headersToJSON(s) {
    var o = {};
    var reg = /([a-z\-]+):\s?(.*);?/gi;
    var m = void 0;
    while (m = reg.exec(s)) {
      o[m[1]] = m[2];
    }
    return o;
  }
};
