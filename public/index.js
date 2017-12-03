(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var operator = require('operator.js').default;

/**
 * Send page views to
 * Google Analytics
 */
function gaTrackPageView() {
  var ga = window.ga;

  if (!ga) return;

  var data = {
    page: window.location.pathname,
    title: document.title
  };

  ga('set', data);

  ga('send', 'pageview');

  if (window.__debug) {
    console.info('Google event', data);
  }
}

var app = operator({});

app.on('afterRender', function () {
  gaTrackPageView();
});

},{"operator.js":3}],2:[function(require,module,exports){
function n(n){return n=n||Object.create(null),{on:function(t,o){(n[t]||(n[t]=[])).push(o)},off:function(t,o){n[t]&&n[t].splice(n[t].indexOf(o)>>>0,1)},emit:function(t,o){(n[t]||[]).map(function(n){n(o)}),(n["*"]||[]).map(function(n){n(t,o)})}}}module.exports=n;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }return target;
};

exports.default = operator;

var _mitt = require('mitt');

var _mitt2 = _interopRequireDefault(_mitt);

var _unfetch = require('unfetch');

var _unfetch2 = _interopRequireDefault(_unfetch);

var _scrollRestoration = require('scroll-restoration');

var _scrollRestoration2 = _interopRequireDefault(_scrollRestoration);

var _cache = require('./lib/cache.js');

var _cache2 = _interopRequireDefault(_cache);

var _util = require('./lib/util.js');

var _routes = require('./lib/routes.js');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function operator(_ref) {
  var _ref$root = _ref.root,
      root = _ref$root === undefined ? 'root' : _ref$root,
      _ref$transitionSpeed = _ref.transitionSpeed,
      transitionSpeed = _ref$transitionSpeed === undefined ? 0 : _ref$transitionSpeed,
      _ref$routes = _ref.routes,
      routes = _ref$routes === undefined ? {} : _ref$routes,
      _ref$evaluateScripts = _ref.evaluateScripts,
      evaluateScripts = _ref$evaluateScripts === undefined ? false : _ref$evaluateScripts;

  if (!window.history.pushState) {
    return console.error('operator: the history API is unavailable, aborting.');
  }

  /**
   * Take control of scroll position
   */
  _scrollRestoration2.default.init();

  /**
   * Changed via enable()/disable() methods
   */
  var ajaxDisabled = false;

  /**
   * Emitter instance
   */
  var ev = (0, _mitt2.default)();

  /**
   * Map over routes to create pattern
   * matching handlers
   */
  routes = Object.keys(routes).map(function (k) {
    return (0, _routes.createRoute)(k, routes[k]);
  });

  /**
   * Update active links to match initial
   * page load
   */
  (0, _util.setActiveLinks)(_util.location.href);

  /**
   * @param {string} markup The new markup from a successful request
   * @param {string} href The new URL
   * @param {boolean} isPopstate True if render is called via popstate, false otherwise
   */
  function render(markup, href, isPopstate) {
    var mountNode = document.getElementById(root);
    var oldDom = document;
    var newDom = new window.DOMParser().parseFromString(markup, 'text/html');
    var title = newDom.title;

    ev.emit('beforeRender', href);

    document.documentElement.classList.add('operator-is-transitioning');
    mountNode.style.height = mountNode.clientHeight + 'px';

    /**
     * After transition out, render new page
     * and (optionally) push a new history location
     */
    setTimeout(function () {
      mountNode.innerHTML = newDom.getElementById(root).innerHTML;

      /**
       * If a popstate event occurred, we don't
       * need to manually create a new history
       * location: it's already there from
       * a previous navigation
       */
      !isPopstate && instance.push(href, title);

      /**
       * Finish up
       */
      setTimeout(function () {
        mountNode.style.height = '';
        document.documentElement.classList.remove('operator-is-transitioning');
        (0, _util.setActiveLinks)(href);
        ev.emit('afterRender', href);
        evaluateScripts && (0, _util.evalScripts)(newDom, oldDom);
        _scrollRestoration2.default.restore();
      }, 0);
    }, transitionSpeed);
  }

  function handleClick(e) {
    if (ajaxDisabled) return;

    var target = e.target;

    /**
     * Find link that was clicked
     */
    while (target && !(target.href && target.nodeName === 'A')) {
      target = target.parentNode;
    }

    /**
     * Validate URL
     */
    var href = (0, _util.getValidPath)(e, target);

    if (href) {
      e.preventDefault();

      if ((0, _util.isSameURL)(target.href)) return;

      /**
       * Only save on clicks, not on popstate
       */
      _scrollRestoration2.default.save();

      instance.go(href);

      return false;
    }
  }

  /**
   * Notes on popstate:
   *  - catches hashchange
   *  - must validate url before AJAX
   */
  function onPopstate(e) {
    if (ajaxDisabled) return;

    e.preventDefault();

    /**
     * If it's a back button, the
     * target should be a window object.
     * Otherwise this could be a hash
     * link or otherwise.
     */
    var path = e.target.window ? e.target.window.location.href : (0, _util.getValidPath)(e, e.target);

    if (path) {
      instance.go(e.target.location.href, true); // set isPopstate to true

      return false;
    }
  }

  var instance = _extends({}, ev, {
    go: function go(href, isPopstate) {
      var _this = this;

      href = (0, _util.getAnchor)(href).href; // ensure it's a full address

      (0, _routes.executeRoute)(href, routes, function (redirect) {
        if (redirect) return _this.go(redirect);

        _this.prefetch(href).then(function (markup) {
          return render(markup, href, isPopstate);
        });
      });
    },
    push: function push(route) {
      var title = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document.title;

      window.history.pushState({}, title, route);
      document.title = title;
    },
    prefetch: function prefetch(route) {
      var cached = _cache2.default.get(route);
      return cached ? Promise.resolve(cached) : (0, _unfetch2.default)(route, { credentials: 'include' }).then(function (res) {
        return res.text();
      }).then(function (markup) {
        _cache2.default.set(route, markup);
        return markup;
      });
    },
    addRoute: function addRoute(route, handler) {
      routes.push((0, _routes.createRoute)(route, handler));
    },
    disable: function disable() {
      ajaxDisabled = true;
    },
    enable: function enable() {
      ajaxDisabled = false;
    },
    isEnabled: function isEnabled() {
      return ajaxDisabled;
    },
    destroy: function destroy() {
      document.body.removeEventListener('click', handleClick);
      window.removeEventListener('popstate', onPopstate);
    }
  });

  document.body.addEventListener('click', handleClick);
  window.addEventListener('popstate', onPopstate);

  /**
   * Runs any applicable routes on page load,
   * restore scroll (if saved at history.state.scrollPosition)
   * *after* routes are fired
   */
  (0, _routes.executeRoute)(window.location.pathname, routes, function (redirect) {
    if (redirect) return instance.go(redirect);
    _scrollRestoration2.default.restore();
  });

  return instance;
}

},{"./lib/cache.js":4,"./lib/routes.js":5,"./lib/util.js":6,"mitt":2,"scroll-restoration":7,"unfetch":8}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }return target;
};

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }return obj;
}

var cache = {};

exports.default = {
  set: function set(route, markup) {
    cache = _extends({}, cache, _defineProperty({}, route, markup));
  },
  get: function get(route) {
    return cache[route];
  }
};

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.collectParams = collectParams;
exports.createRoute = createRoute;
exports.executeRoute = executeRoute;
/**
 * route utils lifted and adapted from
 * dush-router by @@tunnckoCore
 * @see https://github.com/tunnckoCore/dush-router
 */
function collectParams(r, pathname) {
  var match = null;

  pathname.replace(r.regex, function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _loop = function _loop(i) {
      r.keys.forEach(function (key) {
        r.params[key] = args[i];
      });
      match = true;
    };

    for (var i = 1; i < args.length - 2; i++) {
      _loop(i);
    }
  });

  return match ? r.params : match;
}

function createRoute(route, handler) {
  var keys = [];

  var regex = new RegExp(route.replace(/\*/g, '(?:.*)').replace(/([:*])(\w+)/g, function (key) {
    keys.push(key.slice(1));
    return '([\\w-]+)';
  }) + '(?:[\/|?\w+]$|$)' + '$', 'ig');

  return {
    route: route,
    handler: handler,
    regex: regex,
    keys: keys,
    params: {},
    match: function match(pathname) {
      return regex.test(pathname) ? collectParams(this, pathname) : false;
    }
  };
}

function executeRoute(pathname, routes, done) {
  if (routes.length < 1) return done && done();

  var handlers = [];

  /**
   * If we have configured routes,
   * check them and fire any handlers
   */
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = routes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var route = _step.value;

      var params = route.match(pathname);

      /**
       * params will return be `null` if
       * there was a match, but not parametized
       * route params. If params is `false`,
       * it means a no-match, so skip the handler
       */
      if (params === false) {
        continue;
      }

      handlers.push(route.handler(params || {}, pathname));
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

  Promise.all(handlers).then(function (responses) {
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = responses[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var response = _step2.value;

        if (typeof response === 'string') return done(response); // handle redirect
        if (response === false && window.location.pathname !== pathname) {
          return window.location = pathname;
        }
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    done && done();
  });
}

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getOrigin = getOrigin;
exports.getAnchor = getAnchor;
exports.sanitize = sanitize;
exports.isHash = isHash;
exports.isSameURL = isSameURL;
exports.isSameOrigin = isSameOrigin;
exports.getValidPath = getValidPath;
exports.setActiveLinks = setActiveLinks;
exports.evalScripts = evalScripts;
var location = exports.location = window.location;

function getOrigin(loc) {
  var _ref = loc || window.location,
      protocol = _ref.protocol,
      host = _ref.host;

  return protocol + '//' + host;
}

function getAnchor(url) {
  var a = document.createElement('a');
  a.href = url;
  return a;
}

/**
 * @param {string} url Raw URL to parse
 * @return {string} URL sans origin
 */
function sanitize(url) {
  var route = url.replace(new RegExp(getOrigin()), '');
  return route;
}

function isHash(href) {
  return (/#/.test(href)
  );
}

function isSameURL(href) {
  return window.location.search === getAnchor(href).search && window.location.pathname === getAnchor(href).pathname;
}

function isSameOrigin(href) {
  return getOrigin() === getOrigin(getAnchor(href));
}

function getValidPath(e, target) {
  if (!target) return;
  if (!target.href) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (target.target === '_blank') return;
  if (!isSameOrigin(target.href)) return;
  if (isHash(target.href)) return;
  if (target.classList.contains('no-ajax')) return;
  return target.href;
}

var activeLinks = [];

function setActiveLinks(href) {
  var route = getAnchor(href).pathname;
  var regex = /^\/$/.test(route) ? RegExp(/^\/$/) : new RegExp(route);

  for (var i = 0; i < activeLinks.length; i++) {
    activeLinks[i].classList.remove('is-active');
  }

  activeLinks = [].slice.call(document.querySelectorAll('[href$="' + route + '"]'));

  for (var _i = 0; _i < activeLinks.length; _i++) {
    if (regex.test(sanitize(activeLinks[_i].href))) {
      activeLinks[_i].classList.add('is-active');
    }
  }
}

function evalScripts(newDom, existingDom) {
  var existing = Array.prototype.slice.call(existingDom.getElementsByTagName('script'));
  var scripts = newDom.getElementsByTagName('script');

  var _loop = function _loop(i) {
    if (existing.filter(function (e) {
      return e.isEqualNode(scripts[i]);
    }).length > 0) {
      return 'continue';
    }

    var s = document.createElement('script');

    for (var a = 0; a < scripts[i].attributes.length; a++) {
      var attr = scripts[i].attributes[a];
      s.setAttribute(attr.name, attr.value);
    }

    if (!s.src) {
      s.innerHTML = scripts[i].innerHTML;
    }

    document.body.appendChild(s);
  };

  for (var i = 0; i < scripts.length; i++) {
    var _ret = _loop(i);

    if (_ret === 'continue') continue;
  }
}

},{}],7:[function(require,module,exports){
'use strict';var _extends=Object.assign||function(a){for(var c,b=1;b<arguments.length;b++)for(var d in c=arguments[b],c)Object.prototype.hasOwnProperty.call(c,d)&&(a[d]=c[d]);return a},scroll=function(a){return window.scrollTo(0,a)},state=function(){return history.state?history.state.scrollPosition:0},save=function(){var a=0<arguments.length&&arguments[0]!==void 0?arguments[0]:null;history.replaceState(_extends({},history.state,{scrollPosition:a||pageYOffset||scrollY}),'')},restore=function(){var a=0<arguments.length&&arguments[0]!==void 0?arguments[0]:null,b=state();a?a(b):scroll(b)},init=function(){'scrollRestoration'in history&&(history.scrollRestoration='manual',scroll(state()),onbeforeunload=function onbeforeunload(){return save()})};Object.defineProperty(exports,'__esModule',{value:!0});exports.default='undefined'==typeof window?{}:{init:init,save:save,restore:restore,state:state};
},{}],8:[function(require,module,exports){
module.exports="function"==typeof fetch?fetch.bind():function(e,t){return t=t||{},new Promise(function(n,r){function s(){var e,t=[],n=[],r={};return o.getAllResponseHeaders().replace(/^(.*?):\s*([\s\S]*?)$/gm,function(s,o,u){t.push(o=o.toLowerCase()),n.push([o,u]),e=r[o],r[o]=e?e+","+u:u}),{ok:1==(o.status/200|0),status:o.status,statusText:o.statusText,url:o.responseURL,clone:s,text:function(){return Promise.resolve(o.responseText)},json:function(){return Promise.resolve(o.responseText).then(JSON.parse)},blob:function(){return Promise.resolve(new Blob([o.response]))},headers:{keys:function(){return t},entries:function(){return n},get:function(e){return r[e.toLowerCase()]},has:function(e){return e.toLowerCase()in r}}}}var o=new XMLHttpRequest;o.open(t.method||"get",e);for(var u in t.headers)o.setRequestHeader(u,t.headers[u]);o.withCredentials="include"==t.credentials,o.onload=function(){n(s())},o.onerror=r,o.send(t.body)})};

},{}]},{},[1]);
