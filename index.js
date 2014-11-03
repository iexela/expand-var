"use strict";

var concat = Array.prototype.concat,
    slice = Array.prototype.slice;

var _ = require("underscore");

var VAR_REG_EXP = /(\$\$)|(?:\$([a-zA-Z0-9_]+))|(?:\$\{([a-zA-Z0-9_\-]+)})/g;

function isValue(obj) {
  switch(typeof obj) {
    case "string":
    case "number":
      return true;
    case "object":
      return _.isArray(obj);
  }
  return false;
}

//function isContext(obj) {
//  return !isValue(obj);
//}

function variables(val) {
  if(_.isArray(val)) {
    return concat.apply([], _.map(val, variables));
  }

  var match,
      vars = [];

  while(true) {
    match = VAR_REG_EXP.exec(val);
    if(!match) {
      break;
    }

    vars.push(match[2] || match[3]);
  }

  return vars;
}

function resolve(val, context) {
  if(_.isArray(val)) {
    return _.map(val, function(valEl) {
      return resolve(valEl, context);
    });
  }

  if(typeof val !== "string") {
    return val;
  }

  return val.replace(VAR_REG_EXP, function(match, case0, case1, case2/*, case3, offset*/) {
    if(case0) {
      return "$";
    }
    else if(case1 && context[case1] != null) {
      return context[case1];
    }
    else if(case2 && context[case2] != null) {
      return context[case2];
    }
    //else if(case3) {
    //  throw new TypeError("Illegal syntax of variable substitution near " + str.substring(offset, 10));
    //}
    else {
      return match;
    }
  });
}

function chain(/* contexts */) {
  return _.reduce(slice.call(arguments).reverse(), function(l, r) {
    var Clazz = function() {};
    Clazz.prototype = l;
    return _.extend(new Clazz(), r);
  }, {});
}

function Stack() {
  this.data = [];
  this.calculating = {};
}

_.extend(Stack.prototype, {
  push: function(n) {
    if(this.calculating[n]) {
      throw new TypeError("Field '" + n + "' raises circular dependency");
    }

    this.data.push(n);
    this.calculating[n] = true;
  },
  pop: function() {
    var n = this.data.pop();
    this.calculating[n] = false;
    return n;
  },
  top: function() {
    return this.data[this.data.length - 1];
  },
  empty: function() {
    return this.data.length === 0;
  }
});

function expandContext(keys, contexts) {
  var raw = chain.apply(null, contexts),
      cache = {},
      hasInCache = _.bind(_.has, null, cache),
      stack = new Stack(),
      context = {};

  _.each(keys, function(k) {
    if(hasInCache(k)) {
      context[k] = cache[k];
      return;
    }

    stack.push(k);

    while(!stack.empty()) {
      var top = stack.top(),
          vars = variables(raw[top]);

      if(vars.length === 0) {
        cache[top] = raw[top];
        stack.pop();
      }
      else if(_.every(vars, hasInCache)) {
        cache[top] = resolve(raw[top], cache);
        stack.pop();
      }
      else {
        /* jshint loopfunc:true */
        _.each(vars, function(v) {
          if(!hasInCache(v)) {
            stack.push(v);
          }
        });
        /* jshint loopfunc:false */
      }
    }

    context[k] = cache[k];
  });

  return context;
}

function expandValue(root, contexts) {
  var context = expandContext(variables(root), contexts);
  return resolve(root, context);
}

var expand = function(root) {
  if(arguments.length === 0) {
    return undefined;
  }

  if(isValue(root)) {
    return expandValue(root, _.rest(arguments));
  }
  else {
    return expandContext(_.keys(root), arguments);
  }
};

module.exports = expand;