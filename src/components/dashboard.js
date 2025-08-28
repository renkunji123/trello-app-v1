import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import logo from '../img/logo.png';
import { FaBell } from "react-icons/fa6";
import { IoMdPeople } from "react-icons/io";
import { MdLeaderboard } from "react-icons/md";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const BoardCard = ({ board, onClick }) => {
    return (
        <div style={{
            height: '150px',
            padding: '10px',
            borderRadius: '5px',
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: '150px'
        }}>
            <h6 className="card-title">{board.name}</h6>
            <p className="card-text">{board.description}</p>
            <button className="btn btn-outline-secondary mt-2" onClick={() => onClick(board)}>
                Open
            </button>
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

    const handleOpenBoard = (board) => { navigate(`/board?id=${board.id}`); };

    useEffect(() => {
        const token = localStorage.getItem("token");
        // check token trước 
        if (!token) {
            alert("Bạn chưa đăng nhập!");
            navigate("/signin");
            return;
        }

        fetch("http://localhost:3000/auth/users")
            .then(res => res.json()) // 
            .then(data => setAllMembers(data.users))
            .catch(err => console.error("Có lỗi khi lấy danh sách người dùng", err)); 

        fetch("http://localhost:3000/auth/user", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUserProfile(data.user);
                    setProfileForm({ fullName: data.user.fullName || '', avatar: data.user.avatar || '' });
                }
            })
            .catch(error => console.error("Failed to fetch user profile", error)); // Đôi khi lỗi tiếng Anh, lỗi tiếng Việt

        fetch("http://localhost:3000/boards", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setUserBoards(data.boards || []))
            .catch(error => console.error("Lỗi khi tải bảng", error));
    }, [navigate]);

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
    }

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

    return (
        <div className="d-flex flex-column vh-100">
            <header className="d-flex justify-content-between align-items-center text-white p-2" style={{ backgroundColor: '#242A30' }}>
                <img src={logo} alt="logo" height={40} />
                <div className="d-flex align-items-center ml-2">
                    <FaBell size={24} style={{ cursor: 'pointer' }} />
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
            </header>

            <div className="d-flex flex-grow-1 overflow-hidden" style={{ backgroundColor: '#2F3840' }}>
                <div className="d-flex flex-column p-3" style={{ width: "250px", minHeight: "100%" }}>
                    <p className="d-flex align-items-center border rounded px-3 py-2 mb-3" style={{ cursor: "pointer", display: "inline-flex", color: '#fff', backgroundColor: '#2F3840' }}>
                        <MdLeaderboard size={20} className="me-2" />
                        Board List
                    </p>
                    <div className="memberList" >
                        <div className="d-flex align-items-center mb-2 text-white">
                            <IoMdPeople size={20} className="me-2" />
                            <span>All members</span>
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

                <div className="flex-grow-1 p-3 overflow-auto">
                    <div className="mb-3">
                        <h5 style={{ color: '#afafaf' }}>YOUR WORKSPACE</h5>
                    </div>
                    <div className="row g-3">
                        {userBoards.map(board => (
                            <div key={board.id} className="col-2">
                                <BoardCard board={board} onClick={handleOpenBoard} />
                            </div>
                        ))}
                        <div className="col-2">
                            <div
                                className="card d-flex align-items-center justify-content-center"
                                style={{ cursor: "pointer", color: "#afafaf", backgroundColor: '#2F3840', height: '150px' }}
                                onClick={() => setShowBoardModal(true)}
                            >
                                + Create new board
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Profile</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={profileForm.fullName}
                                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Avatar URL</Form.Label>
                            <Form.Control
                                type="text"
                                value={profileForm.avatar || ''}
                                onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowProfileModal(false)}>Close</Button>
                    <Button variant="primary" onClick={handleProfileSave}>Save</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showBoardModal} onHide={() => setShowBoardModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create Board</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={newBoardData.name}
                                onChange={(e) => setNewBoardData({ ...newBoardData, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                type="text"
                                value={newBoardData.description}
                                onChange={(e) => setNewBoardData({ ...newBoardData, description: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowBoardModal(false)}>Close</Button>
                    <Button variant="primary" onClick={handleBoardSave}>Save</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}