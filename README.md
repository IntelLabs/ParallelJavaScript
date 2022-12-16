ParallelJavaScript
==================
> :warning: **DISCONTINUATION OF PROJECT** - 
> *This project will no longer be maintained by Intel.
> Intel has ceased development and contributions including, but not limited to, maintenance, bug fixes, new releases, or updates, to this project.*
> **Intel no longer accepts patches to this project.**
> *If you have an ongoing need to use this project, are interested in independently developing it, or would like to maintain patches for the open source software community, please create your own fork of this project.*


This repository contains a collection of example workloads for Parallel JavaScript. You can check out a live version of these examples [here](http://intellabs.github.io/ParallelJavaScript). We plan to add more workloads over time and welcome contributions.

How To Use
==========

The workloads in this repository use the Parallel JavaScript API as proposed in the [ECMA TC39 strawman for data parallelism](http://wiki.ecmascript.org/doku.php?id=strawman:data_parallelism).
To run the workloads, you will need a browser that implements the Parallel JavaScript API.
Currently, work is underway to add support to Firefox and [nightly builds](http://nightly.mozilla.org) already support the Parallel JavaScript API for ordinary JavaScript arrays.

Some workloads, like the Video example, furthermore require support for the [typed objects API](http://wiki.ecmascript.org/doku.php?id=harmony:typed_objects).
You can watch implementation progress on typed objects in Firefox [here](https://bugzilla.mozilla.org/show_bug.cgi?id=578700).

Support for the Parallel JavaScript API for Typed Objects is currently being implemented in Firefox Nightly and you can follow progress [here](https://bugzilla.mozilla.org/show_bug.cgi?id=972581).

