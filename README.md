ParallelJavaScript
==================

This repository contains a collection of example workloads for Parallel JavaScript. 
We plan to add more workloads over time and welcome contributions.

How To Use
==========

The workloads in this repository use the Parallel JavaScript API as proposed in the [ECMA TC39 strawman for data parallelism](http://wiki.ecmascript.org/doku.php?id=strawman:data_parallelism).
To run the workloads, you will need a browser that implements the Parallel JavaScript APUI.
Currently, work is underway to add support to Firefox and [nightly builds](http://nightly.mozilla.org) already support the Parallel JavaScript API for ordinary JavaScript arrays.

Some workloads, like the tutorial, furthermore require support for the [typed objects API](http://wiki.ecmascript.org/doku.php?id=harmony:typed_objects).
You can watch implementation progress on typed objects in Firefox [here](https://bugzilla.mozilla.org/show_bug.cgi?id=578700).
While support for Parallel JavaScript is being added to typed objects, you can use a [library implementation](https://github.com/nikomatsakis/pjs-polyfill).
It will not provide any speedup (as it runs code sequentially) but allows for experimentation with the API.
