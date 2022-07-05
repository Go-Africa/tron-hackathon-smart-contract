const app = require("./app");

const server = require("http").createServer(app);

/* host and port declarations */
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';


server.listen(PORT,HOST);

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log('Address in use, retrying with another address...');
      setTimeout(() => {
        server.close();
        server.listen();
      }, 1000);
    }
});

server.on('listening', () => {
    console.log(`Server is opened on ${HOST}:${server.address().port}`);
});