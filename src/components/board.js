import React, { useState, useEffect } from 'react';
import logo from '../img/logo.png';
import { FaBell } from "react-icons/fa6";
import { IoMdPeople } from "react-icons/io";
import 'bootstrap/dist/css/bootstrap.min.css';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Modal, Button, Form } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';

const TaskCard = ({ card }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });
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
        marginBottom: '8px'
    };
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <h6 className="card-title">{card.name}</h6>
            <p className="card-text">{card.description}</p>
        </div>
    );
};

export default function Board() {
    const [boardData, setBoardData] = useState(null);
    const [cards, setCards] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [memberList, setMemberList] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [formData, setFormData] = useState({ fullName: '', avatar: '' });
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showNewCardModal, setShowNewCardModal] = useState(false);
    const [newCardData, setNewCardData] = useState({ name: "", description: "" });
    const [currentList, setCurrentList] = useState("");

    const navigate = useNavigate();
    const location = useLocation();
    const sensors = useSensors(useSensor(PointerSensor));

    const handleClose = () => navigate("/dashboard");

    // Fetch board and cards
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const boardId = params.get('id');
        const token = localStorage.getItem('token');
        if (!boardId || !token) return;

        // Fetch board
        fetch(`http://localhost:3000/boards/${boardId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(async data => {
                const board = data.board || data;
                setBoardData(board);

                // Fetch cards riêng
                const cardsRes = await fetch(`http://localhost:3000/boards/${boardId}/cards`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const cardsData = await cardsRes.json();
                const fetchedCards = cardsData.cards || [];

                // Nếu board có mảng cột string, lấy làm statuses
                const colStatuses = Array.isArray(board.cards) 
                    ? board.cards.filter(c => typeof c === 'string') 
                    : ["To Do", "Doing", "Done"];

                // Card object filter
                const cardObjects = fetchedCards.map(c => ({ ...c, status: c.status || "To Do" }));

                setStatuses(colStatuses);
                setCards(cardObjects);
            })
            .catch(err => console.error(err));

        // Fetch all users
        fetch(`http://localhost:3000/auth/users`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setAllUsers(data.users || []))
            .catch(err => console.error(err));

        // Fetch user profile
        fetch("http://localhost:3000/auth/user", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUserProfile(data.user);
                    setFormData({ fullName: data.user.fullName || '', avatar: data.user.avatar || '' });
                }
            });
    }, [location.search]);

    // Map members
    useEffect(() => {
        if (boardData && allUsers.length > 0) {
            const list = (boardData.members || []).map(email => {
                const user = allUsers.find(u => u.email === email);
                return user ? { ...user } : { email };
            });
            setMemberList(list);
        }
    }, [boardData, allUsers]);

    const handleProfileSave = () => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:3000/auth/user", {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(formData)
        })
            .then(res => res.json())
            .then(data => { setUserProfile(data.user); setShowProfileModal(false); })
            .catch(err => console.error(err));
    };

    const handleCreateCard = () => {
        const params = new URLSearchParams(location.search);
        const boardId = params.get('id');
        const token = localStorage.getItem('token');

        if (!newCardData.name) return alert("Tên thẻ không được để trống");

        fetch(`http://localhost:3000/boards/${boardId}/cards`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...newCardData, status: currentList, createdAt: new Date() })
        })
            .then(res => res.json())
            .then(card => {
                setCards(prev => [...prev, { ...card, status: currentList }]);
                setShowNewCardModal(false);
                setNewCardData({ name: "", description: "" });
            })
            .catch(err => console.error(err));
    };

    if (!boardData) return <div>Loading...</div>;

    return (
        <div className="d-flex flex-column vh-100">
            <header className="d-flex justify-content-between align-items-center text-white p-2" style={{ backgroundColor: '#242A30' }}>
                <img src={logo} alt="logo" height={40} />
                <div className="d-flex align-items-center ml-2">
                    <FaBell size={24} style={{ cursor: 'pointer' }} />
                    <div
                        className="d-flex align-items-center p-2"
                        onClick={() => { setFormData({ fullName: userProfile?.fullName, avatar: userProfile?.avatar }); setShowProfileModal(true); }}
                        style={{ cursor: 'pointer' }}
                    >
                        <img className="rounded-circle bg-secondary" alt='profile' src={userProfile?.avatar} style={{ width: "40px", height: "40px" }} />
                    </div>
                </div>
            </header>

            <div className="d-flex flex-grow-1 overflow-hidden" style={{ backgroundColor: '#2F3840' }}>
                <div className="d-flex flex-column p-3" style={{ width: "250px", minHeight: "100%" }}>
                    <p className='text-white'>{boardData.name}</p>
                    <div className="memberList">
                        <div className="d-flex align-items-center mb-2 text-white">
                            <IoMdPeople size={20} className="me-2" /> <span>Members</span>
                        </div>
                        {memberList.length ? memberList.map((member, idx) => (
                            <div key={idx} className="d-flex align-items-center bg-white p-2 mb-2 rounded">
                                <img src={member.avatar || 'https://i.postimg.cc/W4mxd35T/avt.png'} alt="avatar" className="rounded-circle" style={{ width: "40px", height: "40px" }} />
                                <div className="ms-2">
                                    <p className="mb-0 fw-bold">{member.fullName || member.email}</p>
                                    <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>{member.email}</p>
                                </div>
                            </div>
                        )) : <p className="text-white fst-italic">Chưa có thành viên nào</p>}
                    </div>
                    <button className="d-flex rounded align-items-center justify-content-center" style={{ marginTop: "auto", height: '40px', backgroundColor: '#EF5855 ' }} onClick={handleClose}> Close</button>
                </div>

                <div className="flex-grow-2 bg-white">
                    <div className="d-flex justify-content-between align-items-center text-white p-3" style={{ width: '100vw', height: '50px', backgroundColor: '#743254 ' }}>
                        <h5 style={{ color: '#ffffffff' }}>My Trello card</h5>
                    </div>
                    <div className="container-fluid mt-3">
                        <div className="row">
                            {statuses.map(status => (
                                <div key={status} className="col-2">
                                    <div className="card shadow-sm">
                                        <div className="card-header d-flex justify-content-between align-items-center bg-black" style={{ color: '#9b9999ff' }}>
                                            <span>{status}</span>
                                            <button className="btn btn-sm btn-outline-danger"
                                                onClick={() => setCards(prev => prev.filter(c => c.status !== status))}>
                                                &times;
                                            </button>
                                        </div>
                                        <div className="card-body bg-black" style={{ padding: '5px' }}>
                                            {cards.filter(c => c.status === status).map(card => <TaskCard key={card.id} card={card} />)}
                                            <button className="btn btn-outline-secondary mt-2 w-100" onClick={() => { setCurrentList(status); setShowNewCardModal(true); }}>
                                                + Add a task
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Create Card */}
            <Modal show={showNewCardModal} onHide={() => setShowNewCardModal(false)}>
                <Modal.Header closeButton><Modal.Title>Create New Card</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Card Name</Form.Label>
                            <Form.Control type="text" value={newCardData.name} onChange={e => setNewCardData({ ...newCardData, name: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" rows={3} value={newCardData.description} onChange={e => setNewCardData({ ...newCardData, description: e.target.value })} />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowNewCardModal(false)}>Close</Button>
                    <Button variant="primary" onClick={handleCreateCard}>Create</Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Profile */}
            <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)}>
                <Modal.Header closeButton><Modal.Title>Edit Profile</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Avatar URL</Form.Label>
                            <Form.Control type="text" value={formData.avatar || ''} onChange={e => setFormData({ ...formData, avatar: e.target.value })} />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowProfileModal(false)}>Close</Button>
                    <Button variant="primary" onClick={handleProfileSave}>Save</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
