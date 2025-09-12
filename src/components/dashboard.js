import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc, addDoc, deleteDoc, arrayRemove, arrayUnion, getDocs, writeBatch } from 'firebase/firestore'; import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable } from '@dnd-kit/core';
import logo from '../img/logo.png';
import { FaBell } from "react-icons/fa6";
import { IoMdPeople } from "react-icons/io";
import { MdLeaderboard } from "react-icons/md";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseClient';

const BoardCard = ({ board, onClick, onDelete }) => {
    return (
        <div style={{
            minHeight: '150px',
            padding: '10px',
            borderRadius: '5px',
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between', // Đã sửa
            minWidth: '150px'
        }}>
            <div>
                <h6 className="card-title">{board.name}</h6>
                <p className="card-text">{board.description}</p>
            </div>
            <div className="d-flex flex-column">
                <button className="btn btn-outline-secondary mt-2" onClick={() => onClick(board)}>
                    Open
                </button>
                <button className="btn mt-2" style={{ backgroundColor: '#242A30', color: '#fff' }} onClick={(e) => { e.stopPropagation(); onDelete(board.id); }}>
                    Xóa
                </button>
            </div>
        </div>
    );
};

export default function Dashboard() {
    const [allMembers, setAllMembers] = useState([]);
    const [userBoards, setUserBoards] = useState([]);
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState({ fullName: '', avatar: '' });
    const [showBoardModal, setShowBoardModal] = useState(false);
    const [newBoardData, setNewBoardData] = useState({ name: '', description: '' });
    const [pendingInvitations, setPendingInvitations] = useState([]);
    const [showInvitationsModal, setShowInvitationsModal] = useState(false);
    const handleOpenBoard = (board) => { navigate(`/board?id=${board.id}`); };
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState({ title: '', text: '', success: true });
    const [boards, setBoards] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newBoard, setNewBoard] = useState({ name: '', description: '' });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [boardToDelete, setBoardToDelete] = useState(null);
    const token = localStorage.getItem('token');
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Bạn chưa đăng nhập!");
            navigate("/signin");
            return;
        }

        // Lấy thông tin user profile từ backend
        fetch("http://localhost:3000/auth/user", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUserProfile(data.user);
                    setProfileForm({ fullName: data.user.fullName || '', avatar: data.user.avatar || '' });
                } else {
                    alert("Không thể lấy thông tin người dùng!");
                }
            })
            .catch(error => console.error("Failed to fetch user profile", error));

    }, [navigate]);

    useEffect(() => {
        // Chỉ lắng nghe boards khi userProfile đã được tải
        if (userProfile?.email) {
            // Lắng nghe danh sách boards của người dùng từ Firestore
            const unsubscribeBoards = onSnapshot(
                query(collection(db, 'boards'), where('members', 'array-contains', userProfile.email)),
                (querySnapshot) => {
                    const boardsData = [];
                    querySnapshot.forEach((doc) => {
                        boardsData.push({ id: doc.id, ...doc.data() });
                    });
                    setUserBoards(boardsData);
                }, (error) => {
                    console.error("Lỗi khi tải boards", error);
                }
            );
            return () => unsubscribeBoards();
        }
    }, [userProfile]);

    useEffect(() => {
        const unsubscribeUsers = onSnapshot(collection(db, 'users'), (querySnapshot) => {
            const usersData = [];
            querySnapshot.forEach((doc) => {
                usersData.push({ id: doc.id, ...doc.data() });
            });
            setAllMembers(usersData);
        }, (error) => {
            console.error("Có lỗi khi lấy danh sách người dùng", error);
        });

        return () => unsubscribeUsers();
    }, []);
    useEffect(() => {
        if (userProfile?.email) {
            const q = query(collection(db, 'invitations'), where('invitedToEmail', '==', userProfile.email), where('status', '==', 'pending'));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const invitationsData = [];
                querySnapshot.forEach((doc) => {
                    invitationsData.push({ id: doc.id, ...doc.data() });
                });
                setPendingInvitations(invitationsData);
            }, (error) => {
                console.error("Lỗi khi tải lời mời:", error);
            });
            return () => unsubscribe();
        }
    }, [userProfile]);
    const handleProfileSave = () => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:3000/auth/user", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(profileForm)
        })
            .then(res => res.json())
            .then(data => {
                setUserProfile(data.user);
                setShowProfileModal(false);
            })
            .catch(error => console.error("Không thể lưu profile!", error));
    };

    const handleBoardSave = () => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:3000/boards", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(newBoardData)
        })
            .then(res => res.json())
            .then(data => {
                if (data.id) {
                    setUserBoards([...userBoards, data]);
                    setShowBoardModal(false);
                    setNewBoardData({ name: '', description: '' });
                }
            })
            .catch(err => console.error("Thêm board mới thất bại", err));
    };

    const handleDeleteBoard = async (boardId) => {
        try {
            const response = await fetch(`http://localhost:3000/boards/${boardId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Lỗi khi xóa bảng');
            }

            setBoards(prevBoards => prevBoards.filter(board => board.id !== boardId));
            setShowConfirmModal(false);
        } catch (error) {
            console.error("Lỗi khi xóa bảng:", error);
            alert(`Xóa bảng thất bại: ${error.message}`);
        }
    };

    const handleConfirmDelete = (boardId) => {
        setBoardToDelete(boardId);
        setShowConfirmModal(true);
    };
    const handleAcceptInvitation = async (invitation) => {
        try {
            const boardRef = doc(db, 'boards', invitation.boardId);
            const invitationRef = doc(db, 'invitations', invitation.id);

            await updateDoc(boardRef, {
                members: arrayUnion(userProfile.email)
            });

            await updateDoc(invitationRef, {
                status: 'accepted'
            });

            setShowLoadingModal(false);
            setFeedbackMessage({ title: 'Thành công!', text: 'Bạn đã chấp nhận lời mời và trở thành thành viên của board.', success: true });
            setShowFeedbackModal(true);
        } catch (error) {
            console.error("Lỗi khi chấp nhận lời mời:", error);
            setShowLoadingModal(false);
            setFeedbackMessage({ title: 'Lỗi', text: 'Chấp nhận lời mời thất bại.', success: false });
            setShowFeedbackModal(true);
            alert("Chấp nhận lời mời thất bại.");
        }
    };

    const handleDeclineInvitation = async (invitationId) => {
        try {
            const invitationRef = doc(db, 'invitations', invitationId);
            await updateDoc(invitationRef, {
                status: 'declined'
            });
            setShowLoadingModal(false);
            setFeedbackMessage({ title: 'Thành công!', text: 'Bạn đã từ chối lời mời.', success: true });
            setShowFeedbackModal(true);
        } catch (error) {
            console.error("Lỗi khi từ chối lời mời:", error);
            setShowLoadingModal(false);
            setFeedbackMessage({ title: 'Lỗi', text: 'Từ chối lời mời thất bại.', success: false });
            setShowFeedbackModal(true);
        }
    };

    return (
        <div className="d-flex flex-column vh-100">
            <header className="d-flex align-items-center text-white p-2" style={{ backgroundColor: '#242A30' }}>
                <button
                    className="btn btn-dark d-md-none"
                    onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                    style={{ marginRight: '10px' }}
                >
                    ☰
                </button>
                <div className="d-flex flex-grow-1 justify-content-between align-items-center">
                    <img src={logo} alt="logo" height={40} />
                    <div className="d-flex align-items-center ml-2">
                        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowInvitationsModal(true)}>
                            <FaBell size={24} />
                            {pendingInvitations.length > 0 && (
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: '-5px',
                                        right: '-5px',
                                        backgroundColor: 'red',
                                        color: 'white',
                                        borderRadius: '50%',
                                        padding: '2px 6px',
                                        fontSize: '12px',
                                        lineHeight: '1',
                                    }}
                                >
                                    {pendingInvitations.length}
                                </span>
                            )}
                        </div>
                        <div
                            className="d-flex align-items-center p-2"
                            onClick={() => {
                                setProfileForm({
                                    fullName: userProfile?.fullName,
                                    avatar: userProfile?.avatar
                                });
                                setShowProfileModal(true);
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <img className="rounded-circle bg-secondary"
                                alt='profile'
                                src={userProfile?.avatar}
                                style={{ width: "40px", height: "40px" }} />
                        </div>
                    </div>
                </div>
            </header>

            <div className="d-flex flex-grow-1 overflow-hidden" style={{ backgroundColor: '#2F3840' }}>
                {/* Sidebar cho màn hình lớn (hiện từ md trở lên) */}
                <div
                    className="d-none d-md-flex flex-column p-3 bg-dark text-white shadow-lg"
                    style={{ width: "250px" }}
                >
                    <p className="d-flex align-items-center border rounded px-3 py-2 mb-3" style={{ cursor: "pointer", display: "inline-flex", color: '#fff', backgroundColor: '#2F3840' }}>
                        <MdLeaderboard size={20} className="me-2" />
                        Board List
                    </p>
                    <div className="memberList" >
                        <div className="d-flex align-items-center mb-2 text-white">
                            <IoMdPeople size={20} className="me-2" />
                            <span>Tất Cả Thành Viên</span>
                        </div>
                        {allMembers.map((member, idx) => (
                            <div key={idx} className="d-flex align-items-center bg-white p-2 mb-2 rounded" >
                                <img
                                    src={member.avatar || 'https://i.postimg.cc/W4mxd35T/avt.png'}
                                    alt="avatar"
                                    className="rounded-circle"
                                    style={{ width: "40px", height: "40px" }}
                                />
                                <div className="ms-2">
                                    <p className="mb-0 fw-bold">{member.fullName || member.email}</p>
                                    <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>{member.email}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar cho màn hình nhỏ (hiện khi bấm nút) */}
                {isSidebarVisible && (
                    <div
                        className={`d-flex flex-column p-3 position-absolute top-0 bottom-0 start-0 z-index-100 bg-dark text-white shadow-lg d-md-none`}
                        style={{
                            width: "250px",
                            transform: `translateX(${isSidebarVisible ? '0' : '-100%'})`,
                            transition: 'transform 0.3s ease-in-out',
                            display: isSidebarVisible ? 'flex' : 'none',
                            zIndex: 1050,
                        }}
                    >
                        <button
                            className="btn btn-dark align-self-end"
                            onClick={() => setIsSidebarVisible(false)}
                        >
                            X
                        </button>
                        <p className="d-flex align-items-center border rounded px-3 py-2 mb-3" style={{ cursor: "pointer", display: "inline-flex", color: '#fff', backgroundColor: '#2F3840' }}>
                            <MdLeaderboard size={20} className="me-2" />
                            Danh Sách Bảng
                        </p>
                        <div className="memberList" >
                            <div className="d-flex align-items-center mb-2 text-white">
                                <IoMdPeople size={20} className="me-2" />
                                <span>Tất Cả Thành Viên</span>
                            </div>
                            {allMembers.map((member, idx) => (
                                <div key={idx} className="d-flex align-items-center bg-white p-2 mb-2 rounded" >
                                    <img
                                        src={member.avatar || 'https://i.postimg.cc/W4mxd35T/avt.png'}
                                        alt="avatar"
                                        className="rounded-circle"
                                        style={{ width: "40px", height: "40px" }}
                                    />
                                    <div className="ms-2">
                                        <p className="mb-0 fw-bold">{member.fullName || member.email}</p>
                                        <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>{member.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex-grow-1 p-3 overflow-auto">
                    <div className="mb-3">
                        <h5 style={{ color: '#afafaf' }}>YOUR WORKSPACE</h5>
                    </div>
                    <div className="row g-3">
                        {userBoards.map(board => (
                            <div key={board.id} className="col-lg-3 col-md-4 col-sm-6 col-12 mb-3" style={{ minWidth: '280px' }}>
                                <BoardCard board={board} onClick={handleOpenBoard} onDelete={handleConfirmDelete} />
                            </div>
                        ))}
                        <div className="col-lg-3 col-md-4 col-sm-6 col-12 mb-3" style={{ minWidth: '280px' }}>
                            <div
                                className="card d-flex align-items-center justify-content-center"
                                style={{ cursor: "pointer", color: "#afafaf", backgroundColor: '#2F3840', height: '150px' }}
                                onClick={() => setShowBoardModal(true)}
                            >
                                + Create new board
                            </div>
                            {boards.length > 0 ? boards.map((board) => (
                                <BoardCard key={board.id} board={board} onClick={(b) => navigate(`/board?id=${b.id}`)} onDelete={handleConfirmDelete} />
                            )) : null}
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} >
                <div style={{ backgroundColor: '#242A30', color: '#fff'}}>
                    <Modal.Header closeButton>
                        <Modal.Title >Thông Tin Cá Nhân</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3" >
                                <Form.Label>Họ và Tên</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={profileForm.fullName}
                                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Link Avatar</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={profileForm.avatar || ''}
                                    onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                                />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowProfileModal(false)}>Hủy</Button>
                        <Button style={{ backgroundColor: '#242A30' }} onClick={handleProfileSave}>Lưu</Button>
                    </Modal.Footer>
                </div>
            </Modal>

            <Modal show={showBoardModal} onHide={() => setShowBoardModal(false)}>
                <div style={{ backgroundColor: '#242A30', color: '#ffffffff' }}>
                    <Modal.Header closeButton>
                        <Modal.Title >Tạo Bảng Mới</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label >Tên Bảng</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newBoardData.name}
                                    onChange={(e) => setNewBoardData({ ...newBoardData, name: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label >Mô tả</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newBoardData.description}
                                    onChange={(e) => setNewBoardData({ ...newBoardData, description: e.target.value })}
                                />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowBoardModal(false)}>Hủy</Button>
                        <Button style={{ backgroundColor: '#242A30' }} onClick={handleBoardSave}>Lưu</Button>
                    </Modal.Footer>
                </div>
            </Modal>
            <Modal show={showInvitationsModal} onHide={() => setShowInvitationsModal(false)}>
                <Modal.Header closeButton style={{ backgroundColor: '#242A30', borderBottom: '1px solid #6C757D' }}>
                    <Modal.Title style={{ color: '#ffffff' }}>Lời mời tham gia bảng</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: '#242A30' }}>
                    {pendingInvitations.length > 0 ? (
                        pendingInvitations.map((invitation) => (
                            <div key={invitation.id} className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-3 p-3 border rounded" style={{ backgroundColor: '#212325', borderColor: '#6C757D', color: '#6C757D' }}>
                                <div className="mb-2 mb-sm-0 me-sm-2">
                                    <p className="mb-1">
                                        <span className="fw-bold" style={{ color: '#ffffff' }}>{invitation.invitedByEmail}</span> đã mời bạn tham gia bảng của họ.
                                    </p>
                                </div>
                                <div className="d-flex flex-fill">
                                    <Button
                                        variant="success"
                                        onClick={() => handleAcceptInvitation(invitation)}
                                        className="me-2 text-white"
                                        style={{ flex: 1, backgroundColor: '#535353ff', borderColor: '#743254' }}
                                    >
                                        ✔
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => handleDeclineInvitation(invitation.id)}
                                        className="text-white"
                                        style={{ flex: 1, backgroundColor: '#ff7575ff', borderColor: '#EF5855' }}
                                    >
                                        ❌
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Không có lời mời nào đang chờ.</p>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#242A30', borderTop: '1px solid #6C757D' }}>
                    <Button
                        variant="secondary"
                        onClick={() => setShowInvitationsModal(false)}
                        style={{ backgroundColor: '#6C757D', borderColor: '#6C757D', color: '#ffffff' }}
                    >
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal show={showLoadingModal} centered backdrop="static" keyboard={false}>
                <Modal.Body className="text-center" style={{ backgroundColor: '#242A30', color: '#6C757D' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Đang xử lý...</p>
                </Modal.Body>
            </Modal>

            {/* Feedback Modal (Success/Failure) */}
            <Modal show={showFeedbackModal} onHide={() => setShowFeedbackModal(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#242A30', borderBottom: '1px solid #6C757D' }}>
                    <Modal.Title style={{ color: feedbackMessage.success ? '#28a745' : '#dc3545' }}>
                        {feedbackMessage.title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: '#242A30', color: '#6C757D' }}>
                    <p>{feedbackMessage.text}</p>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#242A30', borderTop: '1px solid #6C757D' }}>
                    <Button variant="secondary" onClick={() => setShowFeedbackModal(false)} style={{ backgroundColor: '#6C757D', borderColor: '#6C757D' }}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận xóa bảng</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Bạn có chắc chắn muốn xóa bảng này không? Toàn bộ dữ liệu (thẻ, danh sách) sẽ bị xóa vĩnh viễn.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                        Hủy
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteBoard(boardToDelete)}>
                        Xóa
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}