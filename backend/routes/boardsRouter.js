import express from "express";
import jwt from "jsonwebtoken";
import { db } from "../firebase.js";
import admin from 'firebase-admin';

const router = express.Router();
const JWT_SECRET = "my_secret_key";

async function checkAuth(request, response, next) {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            response.status(401).json({ error: "No token provided" });
            return;
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        request.userEmail = decoded.email;
        next();
    } catch (error) {
        console.error("Authentication error:", error.message);
        return response.status(401).json({ error: "Xác thực thất bại. Token không hợp lệ hoặc đã hết hạn." });
    }
}
router.post("/", checkAuth, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Tên board bị thiếu rồi." });
        }

        const userEmail = req.userEmail;
        const boardRef = db.collection("boards").doc();
        const boardData = {
            id: boardRef.id,
            name,
            description: description || "",
            owner_id: userEmail,
            members: [userEmail],
            lists: ["To Do", "Doing", "Done"],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await boardRef.set(boardData);
        res.status(201).json(boardData);
    } catch (err) {
        console.error("Create board error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/", checkAuth, async (req, res) => {
    try {
        const userEmail = req.userEmail;
        const boardsCollection = db.collection("boards");

        const ownerSnap = await boardsCollection.where("owner_id", "==", userEmail).get();
        const memberSnap = await boardsCollection.where("members", "array-contains", userEmail).get();

        const allBoards = new Map();
        ownerSnap.forEach(doc => allBoards.set(doc.id, { id: doc.id, ...doc.data() }));
        memberSnap.forEach(doc => allBoards.set(doc.id, { id: doc.id, ...doc.data() }));

        const boards = Array.from(allBoards.values());
        res.json({ boards });
    } catch (error) {
        console.error("Get boards error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/:id", checkAuth, async (req, res) => {
    try {
        const boardId = req.params.id;
        const userEmail = req.userEmail;

        const boardDoc = await db.collection("boards").doc(boardId).get();
        if (!boardDoc.exists) return res.status(404).json({ error: "Không tìm thấy board." });

        const board = { id: boardDoc.id, ...boardDoc.data() };
        if (board.owner_id !== userEmail && !(board.members || []).includes(userEmail)) {
            return res.status(403).json({ error: "Không có quyền truy cập." });
        }

        res.json({ board });
    } catch (error) {
        console.error("Get board error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.put("/:id", checkAuth, async (req, res) => {
    try {
        const boardId = req.params.id;
        const userEmail = req.userEmail;
        const { name, description, lists } = req.body;

        const boardRef = db.collection("boards").doc(boardId);
        const docSnap = await boardRef.get();
        if (!docSnap.exists) return res.status(404).json({ error: "Board không tồn tại." });

        const board = docSnap.data();
        if (board.owner_id !== userEmail) {
            return res.status(403).json({ error: "Bạn không có quyền sửa board này." });
        }

        const updates = { updatedAt: new Date() };
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (lists !== undefined) updates.lists = lists;

        await boardRef.update(updates);
        const updatedBoardDoc = await boardRef.get();
        res.json({ id: updatedBoardDoc.id, ...updatedBoardDoc.data() });
    } catch (error) {
        console.error("Update board error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.delete("/:id", checkAuth, async (req, res) => {
    try {
        const boardId = req.params.id;
        const userEmail = req.userEmail;

        const boardDocRef = db.collection("boards").doc(boardId);
        const boardSnap = await boardDocRef.get();
        if (!boardSnap.exists) return res.status(404).json({ error: "Bảng không tồn tại." });

        const board = boardSnap.data();
        if (board.owner_id !== userEmail) return res.status(403).json({ error: "Bạn không thể xóa bảng của người khác." });

        await boardDocRef.delete();
        const invitesSnap = await db.collection("boardInvitations").where("boardId", "==", boardId).get();
        const batch = db.batch();
        invitesSnap.forEach(d => batch.delete(d.ref));
        await batch.commit();

        res.json({ message: "Bảng đã được xóa thành công." });
    } catch (error) {
        console.error("Delete board error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/:boardId/cards", checkAuth, async (req, res) => {
    try {
        const { boardId } = req.params;
        const boardRef = db.collection("boards").doc(boardId);
        const boardSnap = await boardRef.get();
        if (!boardSnap.exists) return res.status(404).json({ error: "Bảng không tồn tại." });

        const cardsSnap = await db.collection("cards").where("boardId", "==", boardId).get();
        const cards = [];
        cardsSnap.forEach(doc => cards.push({ id: doc.id, ...doc.data() }));

        res.json({ cards });
    } catch (err) {
        console.error("Get cards error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/:boardId/cards", checkAuth, async (req, res) => {
    try {
        const { boardId } = req.params;
        const { name, description, status, createdAt } = req.body;
        if (!name) return res.status(400).json({ error: "Tên thẻ là bắt buộc." });

        const boardRef = db.collection("boards").doc(boardId);
        const boardSnap = await boardRef.get();
        if (!boardSnap.exists) return res.status(404).json({ error: "Bảng không tồn tại." });

        const board = boardSnap.data();
        const lists = board.lists || ["To Do", "Doing", "Done"];
        if (status && !lists.includes(status)) return res.status(400).json({ error: "Trạng thái không hợp lệ." });

        const newCardRef = db.collection("cards").doc();
        const cardData = {
            id: newCardRef.id,
            boardId,
            name,
            description: description || "",
            createdAt: createdAt || new Date(),
            status: status || lists[0],
            tasks_count: 0,
            list_member: []
        };

        await newCardRef.set(cardData);
        res.status(201).json(cardData);
    } catch (err) {
        console.error("Create card error:", err);
        res.status(500).json({ error: err.message });
    }
});


router.put("/:boardId/cards/:cardId", checkAuth, async (req, res) => {
    try {
        const { boardId, cardId } = req.params;
        const { name, description, status } = req.body;
        const userEmail = req.userEmail;

        const boardRef = db.collection("boards").doc(boardId);
        const boardSnap = await boardRef.get();
        if (!boardSnap.exists) return res.status(404).json({ error: "Bảng không tồn tại." });

        const board = boardSnap.data();
        const lists = board.lists || ["To Do", "Doing", "Done"];
        if (status && !lists.includes(status)) return res.status(400).json({ error: "Trạng thái không hợp lệ." });

        const cardRef = db.collection("cards").doc(cardId);
        const cardSnap = await cardRef.get();
        if (!cardSnap.exists) return res.status(404).json({ error: "Thẻ không tồn tại." });

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (status !== undefined) updates.status = status;

        await cardRef.update(updates);
        const updatedCardSnap = await cardRef.get();
        res.json({ id: updatedCardSnap.id, ...updatedCardSnap.data() });
    } catch (err) {
        console.error("Update card error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.delete("/:boardId/cards/:cardId", checkAuth, async (req, res) => {
    try {
        const { boardId, cardId } = req.params;
        const userEmail = req.userEmail;

        const boardRef = db.collection("boards").doc(boardId);
        const boardSnap = await boardRef.get();
        if (!boardSnap.exists) return res.status(404).json({ error: "Bảng không tồn tại." });

        const board = boardSnap.data();
        if (board.owner_id !== userEmail && !(board.members || []).includes(userEmail)) {
            return res.status(403).json({ error: "Bạn không có quyền xóa thẻ này." });
        }

        const cardRef = db.collection("cards").doc(cardId);
        const cardSnap = await cardRef.get();
        if (!cardSnap.exists) return res.status(404).json({ error: "Thẻ không tồn tại." });

        await cardRef.delete();
        res.json({ message: "Thẻ đã được xóa thành công." });
    } catch (err) {
        console.error("Delete card error:", err);
        res.status(500).json({ error: err.message });
    }
});
router.post("/:boardId/invite", checkAuth, async (req, res) => {
    try {
        const { invitedEmail } = req.body;
        const { boardId } = req.params;
        const inviterEmail = req.userEmail;

        const userRef = db.collection('users').doc(invitedEmail);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: "Email người dùng không tồn tại." });
        }

        const invitationRef = await db.collection('invitations').add({
            boardId: boardId,
            invitedByEmail: inviterEmail,
            invitedToEmail: invitedEmail,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: "Lời mời đã được gửi thành công." });
    } catch (err) {
        console.error("Lỗi khi gửi lời mời:", err);
        res.status(500).json({ error: "Có lỗi xảy ra khi gửi lời mời." });
    }
});
router.get("/invitations", checkAuth, async (req, res) => {
    try {
        const userEmail = req.userEmail;
        const invitationsSnap = await db.collection("invitations")
            .where("invitedToEmail", "==", userEmail)
            .get();

        const invitations = [];
        for (const doc of invitationsSnap.docs) {
            const invitation = { id: doc.id, ...doc.data() };

            // Lấy thông tin board từ boardId
            const boardDoc = await db.collection("boards").doc(invitation.boardId).get();
            if (boardDoc.exists) {
                invitation.boardName = boardDoc.data().name;
            }

            invitations.push(invitation);
        }

        res.json({ invitations });
    } catch (error) {
        console.error("Get invitations error:", error);
        res.status(500).json({ error: "Có lỗi xảy ra khi lấy lời mời." });
    }
});
router.delete("/:id", checkAuth, async (req, res) => {
    try {
        const boardId = req.params.id;
        const userEmail = req.userEmail;

        const boardRef = db.collection("boards").doc(boardId);
        const boardDoc = await boardRef.get();

        if (!boardDoc.exists) {
            return res.status(404).json({ error: "Board không tồn tại." });
        }

        const boardData = boardDoc.data();

        // Kiểm tra quyền sở hữu: chỉ người tạo mới có thể xóa bảng
        if (boardData.creatorEmail !== userEmail) {
            return res.status(403).json({ error: "Bạn không có quyền xóa bảng này." });
        }

        // Xóa tất cả các thẻ liên quan đến bảng
        const batch = db.batch();
        const cardsQuery = db.collection("cards").where("boardId", "==", boardId);
        const cardsSnapshot = await cardsQuery.get();
        cardsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Xóa bảng
        batch.delete(boardRef);
        await batch.commit();

        res.status(200).json({ message: "Bảng đã được xóa thành công." });
    } catch (err) {
        console.error("Lỗi khi xóa bảng:", err);
        res.status(500).json({ error: "Có lỗi xảy ra khi xóa bảng." });
    }
});
export default router;