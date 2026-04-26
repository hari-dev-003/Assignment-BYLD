import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wealth Tech API',
      version: '1.0.0',
      description: 'Portfolio and stock trading management API for the wealth-tech platform.',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local development' },
    ],
    components: {
      schemas: {
        Portfolio: {
          type: 'object',
          properties: {
            id:          { type: 'string', format: 'uuid' },
            clientName:  { type: 'string' },
            riskProfile: { type: 'string', enum: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'] },
            cashBalance: { type: 'number' },
            createdAt:   { type: 'string', format: 'date-time' },
          },
        },
        Holding: {
          type: 'object',
          properties: {
            symbol:        { type: 'string' },
            quantity:      { type: 'number' },
            averageCost:   { type: 'number' },
            totalInvested: { type: 'string' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error:   { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJSDoc(options);
