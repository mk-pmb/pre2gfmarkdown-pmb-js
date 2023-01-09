
httpGet
=======

Browsers' `window.fetch` has some weird quirks that we might need to deal with.
One easy way to do this is to load [axios][obtain-axios] before you load
`pre2gfm`, in which case it will be automatically detected and used.


  [obtain-axios]: https://github.com/axios/axios


Quirk examples
--------------

* URLs to `fetch()` must not include credentials.
  Instead, you're expected to implement your own HTTP basic auth capability.
  (see https://stackoverflow.com/a/45067331)


