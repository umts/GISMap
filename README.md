GISMap
======

GIS map being developed with AFS (initially for Parking Services)

[App homepage on GIS Confluence][wiki-gis]

[Confluence backend documentation][wiki-backend]

Setup
-----

[Install Yarn](https://yarnpkg.com/en/docs/install)

Install dependencies with:

```
$ yarn
```

Compile the application with:

```
$ yarn run build
```

The built site will be in the `out/` directory. You can start a web server with:

```
$ yarn run serve
```

And view the application at http://localhost:8080/

Project Structure
-----------------

*   `app/` contains the TypeScript components of the application. These are
    compiled into javascript in the "build" step.
*   `static/` contains files that are copied directly into the output directory
    unmodified. This includes 
*   `out/` contains the working copy of the site. It is what is available to
    the browser via the "serve" command, and also what gets zipped up for
    "release".
*   `script/` contains helper scripts for said building and compiling steps.

Reference
---------

* [TypeScript Docs (see the handbook)](https://www.typescriptlang.org/docs/home.html)
* [ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/latest/api-reference/index.html)

[wiki-gis]: https://esdconfluence.it.umass.edu/confluence/display/AFGIS/GIS+-+App+Development+-+Campus+Parking+Map
[wiki-backend]: https://esdconfluence.it.umass.edu/confluence/display/AFGIS/GIS+-+Parking+App+-+Backend
