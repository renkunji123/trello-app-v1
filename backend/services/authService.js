import admin from "firebase-admin";
import { db } from "../firebase.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
const userId = uuidv4();
const JWT_SECRET = "my_secret_key";
const CODE_TTL = 5 * 60 * 1000;
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "renkunji03@gmail.com",
        pass: "rotv sapj oybx hdoa",
    },
});

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
export async function requestCode(email) {
    const userReference = db.collection("users").doc(email);
    const userSnapshot = await userReference.get();

    if (!userSnapshot.exists) {
        throw new Error("Don't have account yet?");
    }
    const code = generateCode();
    const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + CODE_TTL);

    await db.collection("verificationCodes").doc(email).set({
        email,
        code,
        expiresAt,
        used: false,
        createdAt: admin.firestore.Timestamp.now(),
    });

    const mailOptions = {
        from: "rifonsthai@gmail.com",
        to: email,
        subject: "Mã đăng nhập Trello Clone",
        text: `Mã đăng nhập của bạn là: ${code} (hết hạn sau 5 phút).`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Đã gửi code ${code} tới ${email}`);
    } catch (error) {
        console.error("Lỗi gửi mail:", error);
        throw new Error("Không thể gửi email, vui lòng thử lại");
    }

    return { message: "Mã xác thực đã được gửi qua email" };
}
export async function requestCodeSignUp(email) {
    const userReference = db.collection("users").doc(email);
    const userSnapshot = await userReference.get();
    const code = generateCode();
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + CODE_TTL);
    if (userSnapshot.exists) {
        const userData = userSnapshot.data();
        if (userData.status === "active") {
            throw new Error("Account exists, please Signin!");
        }
        await db.collection("verificationCodes").doc(email).set({
            email,
            code,
            expiresAt,
            used: false,
            createdAt: now,
        });
    } else {
        await userReference.set({
            user_id: userId, 
            email,
            fullName: "",
            avatar: "",
            role: "",
            status: "unverified",
            createAt: now,
            lastLoginAt: now,
        });

        await db.collection("verificationCodes").doc(email).set({
            email,
            code,
            expiresAt,
            used: false,
            createdAt: now,
        });
    }

    const mailOptions = {
        from: "renkunji03@gmail.com",
        to: email,
        subject: "Mã đăng nhập Trello Clone",
        text: `Mã đăng nhập của bạn là: ${code} (hết hạn sau 5 phút).`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Đã gửi code ${code} tới ${email}`);
    } catch (error) {
        console.error("Lỗi gửi mail:", error);
        throw new Error("Không thể gửi email, vui lòng thử lại");
    }

    return { message: "Mã xác thực đã được gửi qua email" };
}
export async function verifyCode(email, code) {
    const docRef = db.collection("verificationCodes").doc(email);
    const snap = await docRef.get();

    if (!snap.exists) throw new Error("Mã không tồn tại");
    const data = snap.data();

    if (data.used) throw new Error("Mã đã sử dụng");
    if (Date.now() > data.expiresAt.toMillis()) throw new Error("Mã hết hạn");
    const codeTrimmed = code.toString().trim();
    if (data.code !== codeTrimmed) throw new Error("Mã không đúng");


    const userReference = db.collection("users").doc(email);
    const userSnapshot = await userReference.get();
    const now = admin.firestore.Timestamp.now();

    if (!userSnapshot.exists) {
        throw new Error("Email chưa đăng ký, vui lòng đăng ký tài khoản");
    } else {
        await userReference.update({
            lastLoginAt: now,
            status: userSnapshot.data().status === "unverified" ? "active" : userSnapshot.data().status
        });
    }

    await docRef.update({ used: true });

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });

    return { accessToken: token };
}

export async function getUserFromToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userReference = db.collection("users").doc(decoded.email);
        const snap = await userReference.get();

        if (!snap.exists) throw new Error("User không tồn tại");
        return snap.data();
    } catch (error) {
        throw new Error("Token không hợp lệ hoặc đã hết hạn");
    }
}

