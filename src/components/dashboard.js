import React, { useState } from 'react';
import logo from '../img/logo.png';
import { FaBell } from "react-icons/fa6";
import { IoMdPeople } from "react-icons/io";
import { MdLeaderboard } from "react-icons/md";
import 'bootstrap/dist/css/bootstrap.min.css';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, horizontalListSortingStrategy, } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const BoardCard = ({ board }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: board.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        height: '150px',
        padding: '10px',
        borderRadius: '5px',
        cursor: 'grab',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    };
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <h6 className="card-title">{board.name}</h6>
            <p className="card-text">{board.description}</p>
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
    useEffect(() => {
        fetch("http://localhost:3000/auth/users")
            .then(response => response.json())
            .then(data => setMembers(data.users))
            .catch(error => console.error("không thể load user", error));
    }, []);
    useEffect(() => {
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
    }, []);
    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = boards.findIndex(b => b.id === active.id)
            const newIndex = boards.findIndex(b => b.id === over.id)
            setBoards(arrayMove(boards, oldIndex, newIndex));
        }
    }
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
                                    src={member.avatar || 'data:image/png;base64,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'}
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

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={boards} strategy={horizontalListSortingStrategy}>
                            <div className="row g-3">
                                {boards.map(board => (
                                    <div key={board.id} className="col-2">
                                        <BoardCard board={board} />
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
                        </SortableContext>
                    </DndContext>

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
