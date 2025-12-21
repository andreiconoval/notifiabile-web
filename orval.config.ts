/* eslint-disable */
import 'dotenv/config';
import path from 'node:path';

const OPENAPI_LOCAL = path.resolve(process.cwd(), 'openapi.json');

export default {
  webClient: {
    input: OPENAPI_LOCAL,
    output: {
      target: 'src/api/generated/notifiable.web.ts',
      client: 'react-query',
      override: {
        mutator: { path: 'src/api/http.ts', name: 'customAxios' },
        baseUrl: {
          getBaseUrlFromSpecification: true,
        },
      },
      schemas: 'src/api/generated/schemas',
      prettier: true,
      clean: true,
    },
  },
  serverClient: {
    input: OPENAPI_LOCAL,
    output: {
      target: 'src/api/generated/notifiable.server.ts',
      client: 'axios',
      override: {
        mutator: { path: 'src/api/http.ts', name: 'serverAxios' },
        baseUrl: {
          getBaseUrlFromSpecification: true,
        },
      },
      schemas: 'src/api/generated/schemas',
      prettier: true,
      clean: false,
    },
  },
};
