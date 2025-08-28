import React, { useState, useEffect } from 'react';
import logo from '../img/logo.png';
import { FaBell } from "react-icons/fa6";
import { IoMdPeople } from "react-icons/io";
import 'bootstrap/dist/css/bootstrap.min.css';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Modal, Button, Form, Dropdown } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';

const TaskCard = ({ card }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        padding: '5px',
        borderRadius: '5px',
        cursor: 'grab',
        backgroundColor: '#212325ff ',
        border: "1px solid #6C757D ",
        color: '#6C757D ',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        marginBottom: '8px'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <h6 className="card-title">{card.name}</h6>
        </div>
    );
};

const DroppableColumn = ({ id, children }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: id,
    });
    const style = {
        padding: '10px',
    };

    return (
        <div ref={setNodeRef} style={style}>
            {children}
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
    const [showCardModal, setShowCardModal] = useState(false);
    const [showListModal, setShowListModal] = useState(false);
    const [cardForm, setCardForm] = useState({ id: null, name: "", description: "", status: "" });
    const [listForm, setListForm] = useState({ oldName: "", newName: "" });
    const [draggedCard, setDraggedCard] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const sensors = useSensors(useSensor(PointerSensor));
    const token = localStorage.getItem('token');
    const params = new URLSearchParams(location.search);
    const boardId = params.get('id');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const handleClose = () => navigate("/dashboard");

    useEffect(() => {
        if (!boardId || !token) return;

        const fetchBoardData = async () => {
            try {
                const boardRes = await fetch(`http://localhost:3000/boards/${boardId}`, { headers: { Authorization: `Bearer ${token}` } });
                const boardData = await boardRes.json();
                const board = boardData.board || boardData;
                setBoardData(board);

                const cardsRes = await fetch(`http://localhost:3000/boards/${boardId}/cards`, { headers: { Authorization: `Bearer ${token}` } });
                const cardsData = await cardsRes.json();
                const fetchedCards = cardsData.cards || [];
                const colStatuses = Array.isArray(board.lists) ? board.lists : ["To Do", "Doing", "Done"];
                setStatuses(colStatuses);
                setCards(fetchedCards.map(c => ({ ...c, status: c.status || "To Do" })));

                const usersRes = await fetch(`http://localhost:3000/auth/users`, { headers: { Authorization: `Bearer ${token}` } });
                const usersData = await usersRes.json();
                setAllUsers(usersData.users || []);

                const profileRes = await fetch("http://localhost:3000/auth/user", { headers: { Authorization: `Bearer ${token}` } });
                const profileData = await profileRes.json();
                if (profileData.user) {
                    setUserProfile(profileData.user);
                    setFormData({ fullName: profileData.user.fullName || '', avatar: profileData.user.avatar || '' });
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchBoardData();
    }, [boardId]);

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
        fetch("http://localhost:3000/auth/user", {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(formData)
        }).then(res => res.json())
            .then(data => { setUserProfile(data.user); setShowProfileModal(false); })
            .catch(err => console.error(err));
    };

    const handleOpenNewCard = (status) => {
        setCardForm({ id: null, name: "", description: "", status });
        setShowCardModal(true);
    };
    const handleOpenEditCard = (card) => {
        setCardForm(card);
        setShowCardModal(true);
    };
    const handleSaveCard = () => {
        if (!cardForm.name) return alert("Card name cannot be empty");

        const method = cardForm.id ? "PUT" : "POST";
        const url = cardForm.id
            ? `http://localhost:3000/boards/${boardId}/cards/${cardForm.id}`
            : `http://localhost:3000/boards/${boardId}/cards`;

        fetch(url, {
            method,
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: cardForm.name, description: cardForm.description, status: cardForm.status })
        })
            .then(res => res.json())
            .then(async data => {
                if (!data.id) return;

                setCards(prev => cardForm.id ? prev.map(c => c.id === cardForm.id ? data : c) : [...prev, data]);

                if (!statuses.includes(data.status)) {
                    const updatedStatuses = [...statuses, data.status];
                    setStatuses(updatedStatuses);

                    await fetch(`http://localhost:3000/boards/${boardId}`, {
                        method: 'PUT',
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ lists: updatedStatuses })
                    }).catch(err => console.error(err));
                }

                setShowCardModal(false);
            })
            .catch(err => console.error(err));
    };

    const handleDeleteCard = (id) => {
        fetch(`http://localhost:3000/boards/${boardId}/cards/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        }).then(() => setCards(prev => prev.filter(c => c.id !== id)))
            .catch(err => console.error(err));
    };

    const handleAddList = () => {
        setListForm({ oldName: "", newName: "" });
        setShowListModal(true);
    };
    const handleEditList = (oldName) => {
        setListForm({ oldName, newName: oldName });
        setShowListModal(true);
    };
    const handleSaveList = () => {
        const { oldName, newName } = listForm;
        if (!newName) return alert("List name cannot be empty");

        let updatedStatuses = [...statuses];

        if (oldName) {
            updatedStatuses = updatedStatuses.map(s => s === oldName ? newName : s);
            setCards(prev => prev.map(c => c.status === oldName ? { ...c, status: newName } : c));
        } else {
            if (updatedStatuses.includes(newName)) return alert("List already exists!");
            updatedStatuses.push(newName);
        }

        setStatuses(updatedStatuses);

        fetch(`http://localhost:3000/boards/${boardId}`, {
            method: 'PUT',
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ lists: updatedStatuses })
        }).catch(err => console.error(err));

        setShowListModal(false);
    };
    const handleDeleteList = async (status) => {
        try {
            const cardsToDelete = cards.filter(c => c.status === status);
            for (const c of cardsToDelete) {
                await fetch(`http://localhost:3000/boards/${boardId}/cards/${c.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setCards(prev => prev.filter(c => c.status !== status));

            const updatedStatuses = statuses.filter(s => s !== status);
            await fetch(`http://localhost:3000/boards/${boardId}`, {
                method: 'PUT',
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ lists: updatedStatuses })
            });

            setStatuses(updatedStatuses);

        } catch (err) {
            console.error(err);
        }
    };
    const handleInvite = async () => {
        if (!inviteEmail) {
            alert("Vui lòng nhập địa chỉ email.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/boards/${boardId}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email_member: inviteEmail
                })
            });

            const data = await response.json();

            if (data.success) {
                alert("Lời mời đã được gửi thành công!");
                setShowInviteModal(false);
                setInviteEmail('');

                window.location.reload();
            } else {
                alert(data.error || "Không thể gửi lời mời. Vui lòng thử lại.");
            }
        } catch (error) {
            console.error("Lỗi khi gửi lời mời:", error);
            alert("Đã xảy ra lỗi. Vui lòng kiểm tra lại kết nối.");
        }
    };
    const handleDragStart = (event) => {
        const { active } = event;
        const card = cards.find(c => c.id === active.id);
        if (card) setDraggedCard(card);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over) {
            setDraggedCard(null);
            return;
        }

        const activeCard = cards.find(c => c.id === active.id);
        const overId = over.id;

        if (statuses.includes(overId)) {
            if (activeCard.status !== overId) {
                const updatedCard = { ...activeCard, status: overId };
                setCards(prev => prev.map(c => c.id === activeCard.id ? updatedCard : c));

                try {
                    await fetch(`http://localhost:3000/boards/${boardId}/cards/${activeCard.id}`, {
                        method: 'PUT',
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify(updatedCard)
                    });
                } catch (err) {
                    console.error(err);
                }
            }
        }
        else {
            const overCard = cards.find(c => c.id === overId);
            if (activeCard && overCard && activeCard.status === overCard.status) {
                const itemsInActiveColumn = cards.filter(c => c.status === activeCard.status);
                const oldIndex = itemsInActiveColumn.findIndex(c => c.id === active.id);
                const newIndex = itemsInActiveColumn.findIndex(c => c.id === overId);

                if (oldIndex !== newIndex) {
                    setCards(prev => {
                        const newCards = [...prev];
                        const activeIndex = newCards.findIndex(c => c.id === active.id);
                        const overIndex = newCards.findIndex(c => c.id === overId);

                        const [removed] = newCards.splice(activeIndex, 1);
                        newCards.splice(overIndex, 0, removed);
                        return newCards;
                    });
                }
            }
        }

        setDraggedCard(null);
    };

    if (!boardData) return <div>Loading...</div>;

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="d-flex flex-column vh-100">
                <header className="d-flex justify-content-between align-items-center text-white p-2" style={{ backgroundColor: '#242A30' }}>
                    <img src={logo} alt="logo" height={40} />
                    <div className="d-flex align-items-center ml-2">
                        <FaBell size={24} style={{ cursor: 'pointer' }} />
                        <div className="d-flex align-items-center p-2" onClick={() => { setFormData({ fullName: userProfile?.fullName, avatar: userProfile?.avatar }); setShowProfileModal(true); }} style={{ cursor: 'pointer' }}>
                            <img className="rounded-circle bg-secondary" alt='profile' src={userProfile?.avatar} style={{ width: "40px", height: "40px" }} />
                        </div>
                    </div>
                </header>

                <div className="d-flex flex-grow-1 overflow-hidden" style={{ backgroundColor: '#242A30' }}>
                    <div className="d-flex flex-column p-3" style={{ width: "250px" }}>
                        <p className='text-white'>{boardData.name}</p>
                        <div className="memberList" style={{ flexGrow: 1, overflowY: 'auto' }}>
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
                        <button className="d-flex rounded align-items-center justify-content-center" style={{ height: '40px', backgroundColor: '#EF5855' }} onClick={handleClose}>Close</button>
                    </div>

                    <div className="bg-white" style={{ flex: 1, overflow: 'hidden' }}>
                        <div className="d-flex justify-content-between align-items-center text-white p-3" style={{ height: '50px', backgroundColor: '#743254 ' }}>
                            <h5 style={{ color: '#ffffffff' }}>My Trello card</h5>
                            <Button variant="outline-light bg-black" size="sm" onClick={() => setShowInviteModal(true)}>
                                Invite Member
                            </Button>
                        </div>
                        <div className="container-fluid mt-3" style={{ height: '100%', overflowY: 'auto' }}>
                            <div className="row">
                                {statuses.map(status => (
                                    <div key={status} className="col-2">
                                        <div className="card shadow-sm">
                                            <div className="card-header d-flex justify-content-between align-items-center bg-black" style={{ color: '#9b9999ff' }}>
                                                <span>{status}</span>
                                                <div>
                                                    <Dropdown>
                                                        <Dropdown.Toggle variant="secondary" size="sm" id={`dropdown-${status}`}>
                                                            ...
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu>
                                                            <Dropdown.Item onClick={() => handleEditList(status)}>Edit</Dropdown.Item>
                                                            <Dropdown.Item onClick={() => handleDeleteList(status)}>Delete</Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </div>
                                            </div>
                                            <div className="card-body bg-black d-flex flex-column" style={{ padding: '5px' }}>
                                                <DroppableColumn id={status}>
                                                    <SortableContext items={cards.filter(c => c.status === status).map(c => c.id)}>
                                                        {cards.filter(c => c.status === status).map(card =>
                                                            <TaskCard key={card.id} card={card} />
                                                        )}
                                                    </SortableContext>
                                                </DroppableColumn>
                                                <button className="btn btn-outline-secondary mt-2 w-100" onClick={() => handleOpenNewCard(status)}>
                                                    + Add a card
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="col-2 d-flex align-items-start">
                                    <button className="btn btn-outline-secondary text-white w-100" style={{ backgroundColor: '#a54878ff ' }} onClick={handleAddList}>
                                        + Add another list
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {draggedCard ? (
                        <div style={{
                            padding: '5px',
                            borderRadius: '5px',
                            backgroundColor: '#212325ff',
                            color: '#6C757D',
                            border: "1px solid #6C757D",
                            width: '100%',
                        }}>
                            <h6>{draggedCard.name}</h6>
                        </div>
                    ) : null}
                </DragOverlay>

                <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Profile</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Full Name</Form.Label>
                                <Form.Control type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Avatar URL</Form.Label>
                                <Form.Control type="text" value={formData.avatar} onChange={e => setFormData({ ...formData, avatar: e.target.value })} />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowProfileModal(false)}>Close</Button>
                        <Button variant="primary" onClick={handleProfileSave}>Save Changes</Button>
                    </Modal.Footer>
                </Modal>

                <Modal show={showCardModal} onHide={() => setShowCardModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{cardForm.id ? "Edit Card" : "Add New Card"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Card Name</Form.Label>
                                <Form.Control type="text" value={cardForm.name} onChange={e => setCardForm({ ...cardForm, name: e.target.value })} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control as="textarea" rows={3} value={cardForm.description} onChange={e => setCardForm({ ...cardForm, description: e.target.value })} />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCardModal(false)}>Close</Button>
                        <Button variant="primary" onClick={handleSaveCard}>Save</Button>
                    </Modal.Footer>
                </Modal>
                <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Invite to Board</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Control
                                type="email"
                                placeholder="Email address or name"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleInvite}>
                            Invite
                        </Button>
                    </Modal.Footer>
                </Modal>
                <Modal show={showListModal} onHide={() => setShowListModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{listForm.oldName ? "Edit List" : "Add New List"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>{listForm.oldName ? "New List Name" : "List Name"}</Form.Label>
                            <Form.Control type="text" value={listForm.newName} onChange={e => setListForm({ ...listForm, newName: e.target.value })} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowListModal(false)}>Close</Button>
                        <Button variant="primary" onClick={handleSaveList}>Save</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </DndContext>
    );
}