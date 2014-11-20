"use strict";

var expand = require("../index"),
    _ = require("underscore");

describe("expand", function () {

  var valueEquality = function(a, b) {
    if(typeof a === "object" ^ typeof b === "object") {
      return false;
    }
    else if(typeof a === "object") {
      if(_.isArray(a) ^ _.isArray(b)) {
        return false;
      }
      return objectEquality(a, b);
    }
    else {
      return a === b;
    }
  };

  var objectEquality = function (a, b) {
    if (typeof a === "object" && typeof b === "object") {
      return _.every(a, function(v, k) {
        return valueEquality(v, b[k]);
      }) && _.every(b, function(v, k) {
        return valueEquality(v, a[k]);
      });
    }
    else if(_.isArray(a) && _.isArray(b)) {
      if(a.length === b.length) {
        return _.every(a, function(v, i) {
          return valueEquality(v, b[i]);
        });
      }

      return false;
    }

    return undefined;
  };

  beforeEach(function () {
    jasmine.addCustomEqualityTester(objectEquality);
  });

  it("primitives", function () {
    expect(expand("abc")).toBe("abc");
    expect(expand(3)).toBe(3);
  });

  it("names", function () {
    expect(expand("$abc", {
      abc: 1
    })).toBe("1");

    expect(expand("$abc-def", {
      "abc": 1,
      "abc-": 2,
      "abc-def": 3
    })).toBe("1-def");

    expect(expand("$abc-def", {
      "abc-": 1,
      "abc-def": 2
    })).toBe("$abc-def");

    expect(expand("${abc}", {
      abc: 1
    })).toBe("1");

    expect(expand("${abc-}def", {
      "abc": 1,
      "abc-": 2,
      "abc-def": 3
    })).toBe("2def");

    expect(expand("${abc-def}", {
      "abc": 1,
      "abc-": 2,
      "abc-def": 3
    })).toBe("3");
  });

  it("string expansion", function () {
    expect(expand("$a", {
      a: 1
    })).toBe("1");

    expect(expand("${a}", {
      a: 1
    })).toBe("1");

    expect(expand("$a $b", {
      a: "$b",
      b: 2
    })).toBe("2 2");

    expect(expand("$a ${c}", {
      a: "$b",
      b: 3,
      c: 3
    })).toBe("3 3");
  });

  it("string not found expansion", function () {
    expect(expand("$b", {
      b: ""
    })).toBe("");

    expect(expand("$b", {
      b: null
    })).toBe("$b");

    expect(expand("$b", {
      b: undefined
    })).toBe("$b");
  });

  it("string expansion with nested context", function () {
    expect(expand("$a", {
      a: 1
    }, {
      a: 3
    })).toBe("1");

    expect(expand("$a", {
      a: "$b",
      b: 2
    }, {
      b: 3
    })).toBe("2");

    expect(expand("$a", {
      a: "$b"
    }, {
      b: 3
    }, {
      b: 4
    })).toBe("3");

    expect(expand("$a", {
      b: 5
    }, {
      a: "$b"
    }, {
      a: 1,
      b: 2
    })).toBe("5");
  });

  it("cycle expansion", function () {
    expect(function () {
      expand("$a", {
        a: "$b",
        b: "$a"
      });
    }).toThrow();

    expect(function () {
      expand({
        a: "$b",
        b: "$a"
      });
    }).toThrow();

    expect(function () {
      expand({
        a: "$c",
        b: "$a"
      }, {
        a: 1,
        b: 3,
        c: "$b"
      });
    }).toThrow();

    expect(function () {
      expand({
        a: "$a"
      }, {
        a: 1
      });
    }).toThrow();

    expect(function () {
      expand({
        a: "$b $c"
      }, {
        a: 1,
        b: 3,
        c: "$d"
      }, {
        d: "$a"
      });
    }).toThrow();
  });

  it("object expansion", function () {
    expect(expand({
      a: 1,
      b: 2
    }, {
      c: 3,
      d: 4
    })).toEqual({
      a: 1,
      b: 2
    });

    expect(expand({
      a: 1,
      b: 2,
      c: "$a"
    })).toEqual({
      a: 1,
      b: 2,
      c: "1"
    });

    expect(expand({
      a: "$b $c $d",
      b: 2
    }, {
      c: "1"
    })).toEqual({
      a: "2 1 $d",
      b: 2
    });
  });

  it("object expansion with nested context", function () {
    expect(expand({
      a: 1,
      b: 2
    }, {
      b: 3,
      a: 4,
      c: 5
    })).toEqual({
      a: 1,
      b: 2
    });

    expect(expand({
      a: 1,
      b: 2,
      c: "$a"
    })).toEqual({
      a: 1,
      b: 2,
      c: "1"
    });

    expect(expand({
      a: 1,
      b: 2,
      c: "$a"
    })).toEqual({
      a: 1,
      b: 2,
      c: "1"
    });
  });

  it("special cases", function () {
    expect(expand("$a$b $a", {
      a: 1,
      b: 2
    })).toEqual("12 1");

    expect(expand("${a}$b", {
      a: 1,
      b: 2
    })).toEqual("12");

    expect(expand("$", {
      a: 1,
      b: 2
    })).toEqual("$");

    expect(expand("${}", {
      a: 1,
      b: 2
    })).toEqual("${}");

    expect(expand("$$", {
      a: 1,
      b: 2
    })).toEqual("$");

    expect(expand("$$$", {
      a: 1,
      b: 2
    })).toEqual("$$");

    expect(expand("$$$a", {
      a: 1,
      b: 2
    })).toEqual("$1");

    expect(expand("$a$$", {
      a: 1,
      b: 2
    })).toEqual("1$");
  });

  it("arrays", function() {
    expect(expand([1, 2])).toEqual([1, 2]);

    expect(expand(["$a", "$b"])).toEqual(["$a", "$b"]);

    expect(expand(["$a", "$b"], {
      a: 1,
      b: 2
    })).toEqual(["1", "2"]);

    expect(expand({array: ["$a", "$b"], c: 3}, {
      a: 1,
      b: 2
    })).toEqual({array: ["1", "2"], c: 3});
  });

  it("all", function() {
    expect(expand.all({
      b: 5
    }, {
      a: "$b"
    }, {
      a: 1,
      b: 2
    }, {
      d: "abc"
    })).toEqual({
      a: "5",
      b: 5,
      d: "abc"
    });
  });

  it("defer", function() {
    var d = expand.defer({
      a: "1",
      b: 5,
      c: 7
    });

    expect(d("$b")).toBe("5");

    expect(d({
      p: "$b",
      k: "$a"
    })).toEqual({
      p: "5",
      k: "1"
    });

    expect(d({
      p: "$b",
      k: "$a"
    }, {
      b: 3
    })).toEqual({
      p: "3",
      k: "1"
    });
  });
});