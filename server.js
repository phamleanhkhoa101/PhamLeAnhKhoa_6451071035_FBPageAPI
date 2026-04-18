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
    //1. Lấy thông tin Page
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
    //2. Lấy danh sách bài viết của Page
    /**
     * @swagger
     * /api/page/{pageId}/posts:
     *   get:
     *     summary: Lấy danh sách bài viết của Page
     *     tags: [Page API]
     *     parameters:
     *       - in: path
     *         name: pageId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Thành công
     */
    app.get("/api/page/:pageId/posts", async (req, res) => {
    try {
        const { pageId } = req.params;

        const response = await graph.get(`/${pageId}/posts`, {
        params: {
            fields: "id,message,created_time,permalink_url,full_picture,attachments,likes.summary(true),comments.summary(true)",
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

    //3. Tạo bài viết mới cho Page
/**
 * @swagger
 * /api/page/{pageId}/posts:
 *   post:
 *     summary: Tạo bài viết mới cho Page
 *     tags: [Page API]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Xin chào từ Swagger
 *     responses:
 *       200:
 *         description: Thành công
 */
app.post("/api/page/:pageId/posts", async (req, res) => {
  try {
    const { pageId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "message là bắt buộc"
      });
    }

    const response = await graph.post(
      `/${pageId}/feed`,
      null,
      {
        params: {
          message,
          access_token: PAGE_ACCESS_TOKEN
        }
      }
    );

    res.json({
      success: true,
      message: "Đăng bài viết thành công",
      data: response.data
    });
  } catch (err) {
    res.status(err.response?.status || 500).json(buildError(err));
  }
});

//4. Xóa bài viết theo postId
/**
 * @swagger
 * /api/page/post/{postId}:
 *   delete:
 *     summary: Xóa bài viết theo postId
 *     tags: [Page API]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
app.delete("/api/page/post/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    const response = await graph.delete(`/${postId}`, {
      params: {
        access_token: PAGE_ACCESS_TOKEN
      }
    });

    res.json({
      success: true,
      message: "Xóa bài viết thành công",
      data: response.data
    });
  } catch (err) {
    res.status(err.response?.status || 500).json(buildError(err));
  }
});

//5. Lấy comments của bài viết theo postId
/**
 * @swagger
 * /api/page/post/{postId}/comments:
 *   get:
 *     summary: Lấy comments của bài viết
 *     tags: [Page API]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
app.get("/api/page/post/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;

    const response = await graph.get(`/${postId}/comments`, {
      params: {
        fields: "id,message,from,created_time,like_count,comment_count",
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

//6. Lấy likes của bài viết theo postId
/**
 * @swagger
 * /api/page/post/{postId}/likes:
 *   get:
 *     summary: Lấy likes của bài viết
 *     tags: [Page API]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
app.get("/api/page/post/:postId/likes", async (req, res) => {
  try {
    const { postId } = req.params;

    const response = await graph.get(`/${postId}/likes`, {
      params: {
        summary: true,
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

// //7. Lấy insights của Page theo pageId
// /**
//  * @swagger
//  * /api/page/{pageId}/insights:
//  *   get:
//  *     summary: Lấy insights của Page
//  *     tags: [Page API]
//  *     parameters:
//  *       - in: path
//  *         name: pageId
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Thành công
//  */
// app.get("/api/page/:pageId/insights", async (req, res) => {
//   try {
//     const { pageId } = req.params;

//     const metrics = [
//     "page_impressions",
//     "page_reach_total",
//     "page_post_engagements"
//     ].join(",");

//     const response = await graph.get(`/${pageId}/insights`, {
//     params: {
//         metric: metrics,
//         access_token: PAGE_ACCESS_TOKEN
//     }
//     });

//     res.json({
//       success: true,
//       data: response.data
//     });
//   } catch (err) {
//     res.status(err.response?.status || 500).json(buildError(err));
//   }
// });


/**
 * @swagger
 * /api/page/{pageId}/insights:
 *   get:
 *     summary: Lấy insights của Page theo pageId
 *     tags: [Page API]
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
app.get("/api/page/:pageId/insights", async (req, res) => {
  try {
    const { pageId } = req.params;

    // Sử dụng metric page_views_total với period=day
    const metrics = "page_views_total";
    const period = "day";  // Thử lấy dữ liệu theo ngày

    // API request để lấy insights
    const response = await graph.get(`/${pageId}/insights`, {
      params: {
        metric: metrics,
        period: period,
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