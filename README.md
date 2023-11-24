# SkyNet Chat
Realtime chat app with websockets using Node.js, Express and Socket.io

## Usage

### To start the application

Ensure Docker Desktop is up and running. 
See [the Docker website](https://www.docker.com/products/docker-desktop/) to get started.

```
npm install
npm run dev
```
Go to localhost:3000

### To shutdown the application & the Redis image (Docker container)

```
npm run stop
```

### To shutdown the application, Redis image (Docker container) & cleanup Redis volume data

```
npm run docker-down
```
