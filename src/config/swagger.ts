import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Green Mart API",
      version: "1.0.0",
      description: "Green Mart Backend API Documentation",
    },

    servers: [
      {
        url: "http://localhost:8000",
      },

      {
        url: "https://green-mart-backend.onrender.com",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: ["./src/routes/**/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use(
    "/api-docs",

    swaggerUi.serve,

    swaggerUi.setup(swaggerSpec),
  );
};
