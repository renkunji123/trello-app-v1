import React, { useState, useEffect } from 'react';
import logo from '../img/logo.png';
import { FaBell } from "react-icons/fa6";
import { IoMdPeople } from "react-icons/io";
import { MdLeaderboard } from "react-icons/md";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const BoardCard = ({ board, onClick }) => {
    const style = {
        height: '150px',
        padding: '10px',
        borderRadius: '5px',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minWidth: '150px'
    };

    return (
        <div style={style}>
            <h6 className="card-title">{board.name}</h6>
            <p className="card-text">{board.description}</p>
            <button
                className="btn btn-outline-secondary mt-2"
                onClick={() => { onClick(board); }} >
                Open
            </button>
        </div>
    );
};

export default function Dashboard() {
    const [members, setMembers] = useState([]);
    const [boards, setBoards] = useState([]);
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', avatar: '' });
    const [showBoardModal, setShowBoardModal] = useState(false);
    const [newBoard, setNewBoard] = useState({ name: '', description: '' });

    const handleOpenBoard = (board) => {
        navigate(`/board?id=${board.id}`);
    };

    useEffect(() => {
        fetch("http://localhost:3000/auth/users")
            .then(response => response.json())
            .then(data => setMembers(data.users))
            .catch(error => console.error("không thể load user", error));

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Bạn chưa đăng nhập!");
            navigate("/signin");
            return;
        }
        fetch("http://localhost:3000/auth/user", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(data => {
                if (data.user) {
                    setUserProfile(data.user);
                    setFormData({ fullName: data.user.fullName || '', avatar: data.user.avatar || '' });
                }
            });
        fetch("http://localhost:3000/boards", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(data => setBoards(data.boards || []))
            .catch(error => console.error(error));
    }, [navigate]);

    const handleProfileSave = () => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:3000/auth/user", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                setUserProfile(data.user);
                setShowProfileModal(false);
            })
            .catch(error => console.error(error));
    }

    const handleBoardSave = () => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:3000/boards", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(newBoard)
        })
            .then(res => res.json())
            .then(data => {
                if (data.id) {
                    setBoards([...boards, data]);
                    setShowBoardModal(false);
                    setNewBoard({ name: '', description: '' });
                }
            })
            .catch(err => console.error(err));
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
                            setFormData({
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
                        {members.map((member, idx) => (
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
                        {boards.map(board => (
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

            {/* Profile Modal */}
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
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Avatar URL</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.avatar || ''}
                                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowProfileModal(false)}>Close</Button>
                    <Button variant="primary" onClick={handleProfileSave}>Save</Button>
                </Modal.Footer>
            </Modal>

            {/* Board Modal */}
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
                                value={newBoard.name}
                                onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                type="text"
                                value={newBoard.description}
                                onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
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
