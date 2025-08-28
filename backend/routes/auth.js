import express from "express";
import { db, default as admin } from "../firebase.js";
import { requestCode, requestCodeSignUp, verifyCode } from "../services/authService.js";
import jwt from "jsonwebtoken";
import multer from "multer";
import { getStorage } from "firebase-admin/storage";
const JWT_SECRET = "my_secret_key";
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/request-code-signin", async (request, response) => {
    try {
        const { email } = request.body;
        const result = await requestCode(email);
        response.json(result);
    } catch (error) {
        response.status(400).json({ error: error.message });
    }
});
router.post("/request-code-signup", async (request, response) => {
    try {
        const { email } = request.body;
        const result = await requestCodeSignUp(email);
        response.json(result);
    } catch (error) {
        response.status(400).json({ error: error.message });
    }
});
router.post("/verify-code", async (request, response) => {
    try {
        const { email, code } = request.body;
        if (!email || !code) return response.status(400).json({ error: "Email hoặc code không được để trống." });
        const result = await verifyCode(email, code);
        response.json(result);
    } catch (error) {
        response.status(400).json({ success: false, error: error.message });
    }
});
router.get("/users", async (request, response) => {
    try {
        const usersSnapshot = await db.collection("users")
            .where("status", "==", "active")
            .get();

        const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        response.json({ users });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

async function checkAuth(request, response, next) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader) return response.status(401).json({ error: "Không tìm thấy token. Vui lòng đăng nhập lại." });
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        request.userEmail = decoded.email;
        next();
    } catch (error) {
        return response.status(401).json({ error: "Token không hợp lệ hoặc đã hết hạn." });
    }
}

router.put("/user", checkAuth, async (request, response) => {
    try {
        const { fullName, avatar } = request.body;
        const userRef = db.collection("users").doc(request.userEmail);
        await userRef.update({ fullName, avatar });
        const updatedUser = await userRef.get();
        response.json({ user: updatedUser.data() });
    } catch (error) {
        response.status(500).json({ error: "Lỗi server khi cập nhật người dùng." });
    }
});

router.get("/user", checkAuth, async (request, response) => {
    try {
        const userDoc = await db.collection("users").doc(request.userEmail).get();
        if (!userDoc.exists) return response.status(404).json({ error: "Người dùng không tồn tại." });
        response.json({ user: userDoc.data() });
    } catch (error) {
        response.status(500).json({ error: "Lỗi khi lấy thông tin người dùng." });
    }
});

export default router;