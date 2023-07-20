import 'dotenv/config';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { hiveApollo } from '@graphql-hive/client';
import { mergeResolvers } from '@graphql-tools/merge';
import express from 'express';
import { json } from 'body-parser';

import http from 'http';
import https from 'https';
import fs from 'fs';
import cors from 'cors';

import typeDefs from './schema/typedefs';

const port = process.env.HTTP_PORT ?? 8880;
const httpsPort = process.env.HTTPS_PORT ?? 8443;
const socketIoPort = process.env.SOCKET_PORT ?? 2096;

const app = express();
const httpServer = http.createServer(app);
const httpsServer = getHttpsServer(app);
const resolvers = mergeResolvers([
  {
    Query: {},
  },
]);

startApolloServer(app);

interface MyContext {
  token?: String;
}

function getHttpsServer(app?: express.Application): http.Server {
  try {
    const privateKey = fs.readFileSync('privatekey.pem');
    const certificate = fs.readFileSync('certificate.pem');

    if (app) {
      return https.createServer(
        {
          key: privateKey,
          cert: certificate,
        },
        app
      );
    } else {
      return https.createServer({
        key: privateKey,
        cert: certificate,
      });
    }
  } catch (e) {
    if (app) {
      return http.createServer(app);
    } else {
      return http.createServer();
    }
  }
}

async function startApolloServer(app: express.Application) {
  const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server)
  );

  if (require.main === module) {
    httpServer.listen(port, () => {
      console.log(`🚀  Apollo Server ready on ${port}`);
    });

    httpsServer.listen(httpsPort, () => {
      console.log(`🚀  Apollo Server SSL ready on ${httpsPort}`);
    });
  }
}
