require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
app.use(cors());
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Facebook Page API",
      version: "1.0.0",
      description: "API Backend cho Facebook Page Graph API"
    },
    servers: [
      {
        url: "http://localhost:3000"
      }
    ]
  },
  apis: [__filename]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/swagger", swaggerUi.serve);
app.get("/swagger", swaggerUi.setup(swaggerSpec));


const PORT = process.env.PORT || 3000;
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v25.0";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

if (!PAGE_ACCESS_TOKEN) {
  console.error("Thiếu PAGE_ACCESS_TOKEN trong file .env");
  process.exit(1);
}

const graph = axios.create({
  baseURL: `https://graph.facebook.com/${GRAPH_API_VERSION}`,
  timeout: 15000
});

function buildError(err) {
  if (err.response?.data) {
    return {
      success: false,
      message: "Facebook Graph API error",
      error: err.response.data
    };
  }

  return {
    success: false,
    message: err.message || "Unknown server error"
  };
}

/**
 * @swagger
 * /api/page/{pageId}:
 *   get:
 *     summary: Lấy thông tin Page
 *     tags: [Page API]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của Page
 *     responses:
 *       200:
 *         description: Thành công
 */
app.get("/api/page/:pageId", async (req, res) => {
  try {
    const { pageId } = req.params;

    const response = await graph.get(`/${pageId}`, {
      params: {
        fields: "id,name,about,category,fan_count,followers_count,link,picture{url}",
        access_token: PAGE_ACCESS_TOKEN
      }
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (err) {
    res.status(err.response?.status || 500).json(buildError(err));
  }
});


/**
 * Route test
 */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Facebook Page API backend đang chạy"
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});