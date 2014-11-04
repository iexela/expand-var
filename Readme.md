# expand-var

> Simple library to expand variables in the provided context(s)

## Getting Started

You can install expand-var globally by the following command:

```shell
npm install -g expand-var
```

or locally:

```shell
npm install expand-var
```

## How to use it

expand-var is a simple library which allows to expand variable in the provided context or contexts. Context is a plain JS object. Look at the following example to understand how to use it.

```js
var expand = require("expand-var");

var result = expand("$src/js/**", {
  root: "my-project",
  src: "$root/src"
});
console.log(result);
```

This code will print

```js
> my-project/src/js/**
```

Each variable should be preceded by a symbol `$`. In the example above there are two variables `$src` and `$root`. They both are resolved in the provided context. `$root` is resolved to `my-project` and `src` to `my-project/src`. Consequently the source string is resolved to `my-project/src/js/**`.

Behavior of this module is very similar to variable expansion you might use in shell scripts. You can use this module as:

```js
expand("My home directory is $HOME", process.env);
```

**Note.** Variables also can be specified in curly braces, as `${src}`

**Note.** Variables are case-sensitive. Names `src`, `Src` and `SRC` are different.

**Note.** This library is not for path expansion. There are another libraries which fulfil such task very good.

### Several contexts

Also you can combine several contexts, as in the following example:

```js
var result = expand("$src/js/**", {
  root: "not-my-project"
}, {
  root: "my-project",
  src: "$root/src"
});
console.log(result);
```

prints

```js
> not-my-project/src/js/**
```

Variables is resolved starting from the leftmost context to the right. Example above shows that `$root` was found in the leftmost context and `$src` in the right.

One more example:

Find the path to favourite directory. If `FAVOURITE` environment variable is not defined use predefined:

```js
expand("My favourite directory is $FAVOURITE", process.env, {
  FAVOURITE: "$HOMEPATH/favourite"
});
```

Number of context is not restricted. You can specify as much contexts as you want.

### Arrays

Values in the array are also resolved:

```js
var result = expand(["$src/js/**", "$src/css/**"], {
  root: "my-project",
  src: "$root/src"
});
console.log(result);
```

prints

```js
> [ 'my-project/src/js/**', 'my-project/src/css/**' ]
```

### Objects

The first argument for expand function may be not only string or array, but also a plain JS object.

```js
var result = expand({
  js: "$src/js/**",
  css: "$src/css/**",
  res: ["$src/css/img", "$other"]
}, {
  root: "my-project",
  src: "$root/src",
  other: "$root/other"
});
console.log(result);
```

prints

```js
> var result = expand({
>   js: "$src/js/**",
>   css: "$src/css/**",
>   res: ["$src/css/img", "$other"]
> }, {
>   root: "my-project",
>   src: "$root/src",
>   other: "$root/other"
> });
console.log(result);
```

## Restrictions

### Nested objects

Only properties of context participate in resolve process. This means that you cannot refer nested objects in the contexts (at least now).

```js
var result = expand("$src/js/**", {
  root: "my-project",
  src: {
    dir1: "$root/dir1",
    dir2: "$root/dir2"
  }
});

console.log(result);
```

prints

```js
> [object Object]/js/**
```

Or

```js
var result = expand({
  js: "$src/js/**",
  css: {
    dir1: "$src/css/dir1",
    dir2: "$src/css/dir2"
  }
}, {
  root: "my-project",
  src: "$root/src/**"
});

console.log(result);
```

prints

```js
> { js: 'my-project/src/**/js/**',
>   css: { dir1: '$src/css/dir1', dir2: '$src/css/dir2' } }
```

### Cycle references

Cycle references are not allowed. Following code raises error.

```js
expand({
  a: "$b",
  b: "$a"
});
```