# cube-viewer

Cube Viewer is both an **app** and a **reusable component** to visualize data
cubes based on the [rdf-cube-schema](https://github.com/zazuko/rdf-cube-schema).

A demo of the app is deployed at [cube-viewer.zazuko.com](https://cube-viewer.zazuko.com).

## Link to a specific cube

It is possible to create a link to view a specific cube:
`https://cube-viewer.zazuko.com?endpointUrl=<endpoint URI>&cube=<cube URI>`

The following query params are supported:
- `endpointUrl` (mandatory): URL of the SPARQL endpoint
- `cube`: URI of the cube
- `sourceGraph`: URI of the graph
- `user`: username to connect to the endpoint
- `password`: password to connect to the endpoint (it's probably not a good
  idea to share links that contain passwords...)

## Use the component

TODO

## Development

Setup project:
```
git clone https://github.com/zazuko/cube-viewer.git
cd cube-viewer
npm install
```

Start development server:
```
npm run serve
```

Run tests:
```
npm run test:unit
npm run lint
```

Compile app for production:
```
npm run build
```

Compile component app for production:
```
npm run build-wc
```

Deploy a new version of the app:
```
npm run deploy
```
