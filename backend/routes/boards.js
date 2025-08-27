import express from "express";
import jwt from "jsonwebtoken";
import { db } from "../firebase.js"; 

const router = express.Router();
const JWT_SECRET = "my_secret_key"; 

async function checkAuth(request, response, next) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) return response.status(401).json({ error: "No token" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    request.userEmail = decoded.email; 
    next();
  } catch (error) {
    return response.status(401).json({ error: "Unauthorized" });
  }
}

router.post("/", checkAuth, async (request, response) => {
  try {
    const { name, description } = request.body;
    if (!name) return response.status(400).json({ error: "Name is required" });

    const now = new Date();
    const boardRef = db.collection("boards").doc();
    const boardData = {
      name,
      description: description || "",
      owner_id: request.userEmail,
      members: [], 
      createdAt: adminTimestamp(now),
      updatedAt: adminTimestamp(now),
    };

    await boardRef.set(boardData);

    response.status(201).json({
      id: boardRef.id,
      ...boardData,
    });
  } catch (error) {
    console.error("Create board error:", error);
    response.status(500).json({ error: error.message });
  }
});

router.get("/", checkAuth, async (request, response) => {
  try {
    const userEmail = request.userEmail;
    const boardsRef = db.collection("boards");

    const ownerSnap = await boardsRef.where("owner_id", "==", userEmail).get();

    const memberSnap = await boardsRef.where("members", "array-contains", userEmail).get();

    const resultMap = new Map();

    ownerSnap.forEach(doc => resultMap.set(doc.id, { id: doc.id, ...doc.data() }));
    memberSnap.forEach(doc => resultMap.set(doc.id, { id: doc.id, ...doc.data() }));

    const boards = Array.from(resultMap.values());

    response.json({ boards });
  } catch (error) {
    console.error("Get boards error:", error);
    response.status(500).json({ error: error.message });
  }
});

router.get("/:id", checkAuth, async (request, response) => {
  try {
    const boardId = request.params.id;
    const userEmail = request.userEmail;

    const doc = await db.collection("boards").doc(boardId).get();
    if (!doc.exists) return response.status(404).json({ error: "Board not found" });

    const board = { id: doc.id, ...doc.data() };

    if (board.owner_id !== userEmail && !(board.members || []).includes(userEmail)) {
      return response.status(403).json({ error: "Access denied" });
    }

    response.json({ board });
  } catch (error) {
    console.error("Get board error:", error);
    response.status(500).json({ error: error.message });
  }
});

router.put("/:id", checkAuth, async (request, response) => {
  try {
    const boardId = request.params.id;
    const userEmail = request.userEmail;
    const { name, description } = request.body;

    const ref = db.collection("boards").doc(boardId);
    const snap = await ref.get();
    if (!snap.exists) return response.status(404).json({ error: "Board not found" });

    const board = snap.data();
    if (board.owner_id !== userEmail) return response.status(403).json({ error: "Only owner can update board" });

    const updates = { updatedAt: adminTimestamp(new Date()) };
    if (typeof name !== "undefined") updates.name = name;
    if (typeof description !== "undefined") updates.description = description;

    await ref.update(updates);

    const updated = await ref.get();
    response.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    console.error("Update board error:", error);
    response.status(500).json({ error: error.message });
  }
});

router.delete("/:id", checkAuth, async (request, response) => {
  try {
    const boardId = request.params.id;
    const userEmail = request.userEmail;

    const ref = db.collection("boards").doc(boardId);
    const snap = await ref.get();
    if (!snap.exists) return response.status(404).json({ error: "Board not found" });

    const board = snap.data();
    if (board.owner_id !== userEmail) return response.status(403).json({ error: "Only owner can delete board" });

    await ref.delete();
    const invitesSnap = await db.collection("boardInvitations").where("boardId", "==", boardId).get();
    const batch = db.batch();
    invitesSnap.forEach(d => batch.delete(d.ref));
    await batch.commit();

    response.json({ message: "Board deleted successfully" });
  } catch (error) {
    console.error("Delete board error:", error);
    response.status(500).json({ error: error.message });
  }
});

router.post("/:boardId/invite", checkAuth, async (request, response) => {
  try {
    const boardId = request.params.boardId;
    const { userId: invitedUserId } = request.body;
    const inviter = request.userEmail;

    if (!invitedUserId) return response.status(400).json({ error: "userId to invite is required" });

    const boardRef = db.collection("boards").doc(boardId);
    const boardSnap = await boardRef.get();
    if (!boardSnap.exists) return response.status(404).json({ error: "Board not found" });

    const board = boardSnap.data();
    if (board.owner_id !== inviter) return response.status(403).json({ error: "Only owner can invite" });

    if ((board.members || []).includes(invitedUserId) || board.owner_id === invitedUserId) {
      return response.status(400).json({ error: "User already part of board" });
    }

    const now = adminTimestamp(new Date());
    const invRef = db.collection("boardInvitations").doc();
    const invData = {
      boardId,
      inviterId: inviter,
      invitedUserId,
      status: "pending",
      createdAt: now,
    };
    await invRef.set(invData);

    response.json({ message: "Invitation sent", invitationId: invRef.id });
  } catch (error) {
    console.error("Invite error:", error);
    response.status(500).json({ error: error.message });
  }
});

router.post("/:boardId/invite/:invitationId/respond", checkAuth, async (request, response) => {
  try {
    const { boardId, invitationId } = request.params;
    const { status } = request.body; 
    const userEmail = request.userEmail;

    if (!["accepted", "rejected"].includes(status)) return response.status(400).json({ error: "Invalid status" });

    const invRef = db.collection("boardInvitations").doc(invitationId);
    const invSnap = await invRef.get();
    if (!invSnap.exists) return response.status(404).json({ error: "Invitation not found" });

    const inv = invSnap.data();
    if (inv.boardId !== boardId) return response.status(400).json({ error: "Invitation does not match board" });
    if (inv.invitedUserId !== userEmail) return response.status(403).json({ error: "This invitation is not for you" });
    if (inv.status !== "pending") return response.status(400).json({ error: "Invitation already responded" });

    await invRef.update({ status });

    if (status === "accepted") {
      const boardRef = db.collection("boards").doc(boardId);
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(boardRef);
        if (!snap.exists) throw new Error("Board not found");

        const board = snap.data();
        const members = board.members || [];
        if (!members.includes(userEmail)) {
          members.push(userEmail);
          tx.update(boardRef, { members, updatedAt: adminTimestamp(new Date()) });
        }
      });
    }

    response.json({ message: `Invitation ${status}` });
  } catch (error) {
    console.error("Respond invite error:", error);
    response.status(500).json({ error: error.message });
  }
});

export default router;
function adminTimestamp(date) {
  return date;
}
