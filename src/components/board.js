import React, { useState, useEffect } from 'react';
import logo from '../img/logo.png';
import { FaBell } from "react-icons/fa6";
import { IoMdPeople } from "react-icons/io";
import 'bootstrap/dist/css/bootstrap.min.css';
import { collection, onSnapshot, query, where, doc, updateDoc, addDoc, deleteDoc, arrayRemove, arrayUnion, getDocs, writeBatch } from 'firebase/firestore'; import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Modal, Button, Form, Dropdown } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebaseClient';

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
    const [pendingInvitations, setPendingInvitations] = useState([]);
    const [invitedEmail, setInvitedEmail] = useState('');
    const [showInvitationsModal, setShowInvitationsModal] = useState(false);
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState({ title: '', text: '', success: true });
    const [hoveredMember, setHoveredMember] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    useEffect(() => {
        if (!boardId || !token) return;

        // realtime dữ liệu board hiện tại
        const unsubscribeBoard = onSnapshot(doc(db, 'boards', boardId), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setBoardData({ id: docSnapshot.id, ...data });
                setStatuses(Array.isArray(data.lists) ? data.lists : ["To Do", "Doing", "Done"]);
            } else {
                setBoardData(null);
            }
        }, (error) => {
            console.error("Lỗi khi lấy dữ liệu board:", error);
        });

        // realtime danh sách tất cả người dùng
        const unsubscribeUsers = onSnapshot(collection(db, 'users'), (querySnapshot) => {
            const usersData = [];
            querySnapshot.forEach((doc) => {
                usersData.push({ id: doc.id, ...doc.data() });
            });
            setAllUsers(usersData);
        }, (error) => {
            console.error("Lỗi khi lấy danh sách users:", error);
        });

        // realtime danh sách cards trong board
        const qCards = query(collection(db, 'cards'), where('boardId', '==', boardId));
        const unsubscribeCards = onSnapshot(qCards, (querySnapshot) => {
            const cardsData = [];
            querySnapshot.forEach((doc) => {
                cardsData.push({ id: doc.id, ...doc.data() });
            });
            setCards(cardsData);
        }, (error) => {
            console.error("Lỗi khi lấy danh sách cards:", error);
        });

        // fetch user profile 
        fetch("http://localhost:3000/auth/user", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(data => {
                if (data.user) {
                    setUserProfile(data.user);
                    setFormData({ fullName: data.user.fullName || '', avatar: data.user.avatar || '' });
                }
            })
            .catch(error => console.error("Lỗi khi lấy user profile:", error));

        // ngừng lắng nghe 
        return () => {
            unsubscribeBoard();
            unsubscribeUsers();
            unsubscribeCards();
        };

    }, [boardId, token, navigate]);

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
    const handleSaveList = async () => {
        if (!listForm.newName) {
            alert("List name cannot be empty");
            return;
        }

        // Nếu là thêm mới list
        if (!listForm.oldName) {
            try {
                const boardRef = doc(db, 'boards', boardId);
                await updateDoc(boardRef, {
                    lists: arrayUnion(listForm.newName)
                });
                setShowListModal(false);
                setListForm({ newName: '', oldName: '' });
            } catch (error) {
                console.error("Lỗi khi thêm list mới:", error);
                alert("Thêm list thất bại. Vui lòng thử lại.");
            }
        } else {
            // Nếu là sửa list cũ
            try {
                const boardRef = doc(db, 'boards', boardId);
                const updatedLists = boardData.lists.map(list =>
                    list === listForm.oldName ? listForm.newName : list
                );
                await updateDoc(boardRef, {
                    lists: updatedLists
                });

                // Cập nhật trường `status` của tất cả các card
                const batch = writeBatch(db);
                const q = query(collection(db, 'cards'), where('boardId', '==', boardId), where('status', '==', listForm.oldName));
                const querySnapshot = await getDocs(q);

                querySnapshot.forEach(cardDoc => {
                    const cardRef = doc(db, 'cards', cardDoc.id);
                    batch.update(cardRef, { status: listForm.newName });
                });
                await batch.commit();

                setShowListModal(false);
                setListForm({ newName: '', oldName: '' });
            } catch (error) {
                console.error("Lỗi khi cập nhật list:", error);
                alert("Cập nhật list thất bại. Vui lòng thử lại.");
            }
        }
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
        if (!invitedEmail) {
            setFeedbackMessage({ title: 'Lỗi', text: 'Email không được để trống!', success: false });
            setShowFeedbackModal(true);
            return;
        }
        if (boardData.members.includes(invitedEmail)) {
            setFeedbackMessage({ title: 'Cảnh báo', text: 'Người dùng này đã là thành viên của board.', success: false });
            setShowFeedbackModal(true);
            return;
        }
        setShowInviteModal(false);
        setShowLoadingModal(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/boards/${boardData.id}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ invitedEmail })
            });

            if (!response.ok) {
                throw new Error('Lỗi khi gửi lời mời');
            }

            const data = await response.json();
            setShowLoadingModal(false);
            setFeedbackMessage({ title: 'Thành công!', text: 'Lời mời đã được gửi thành công!', success: true });
            setShowFeedbackModal(true);
        } catch (error) {
            setShowLoadingModal(false);
            setFeedbackMessage({ title: 'Lỗi', text: error.message || 'Lỗi khi gửi lời mời.', success: false });
            setShowFeedbackModal(true);
            alert(error.message);
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

    const handleRemoveMember = async (memberEmail) => {
        try {
            const boardRef = doc(db, 'boards', boardId);
            await updateDoc(boardRef, {
                members: arrayRemove(memberEmail)
            });
            console.log(`Đã xóa thành viên ${memberEmail} khỏi bảng.`);
        } catch (error) {
            console.error("Lỗi khi xóa thành viên:", error);
        }
    };
    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                            <div className="d-flex align-items-center p-2" onClick={() => { setFormData({ fullName: userProfile?.fullName, avatar: userProfile?.avatar }); setShowProfileModal(true); }} style={{ cursor: 'pointer' }}>
                                <img className="rounded-circle bg-secondary" alt='profile' src={userProfile?.avatar} style={{ width: "40px", height: "40px" }} />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="d-flex flex-grow-1 overflow-hidden" style={{ backgroundColor: '#242A30' }}>
                    {/* sidebar cho màn hình lớn */}
                    <div
                        className="d-none d-md-flex flex-column p-3 bg-dark text-white shadow-lg"
                        style={{ width: "250px" }}
                    >
                        <p className='text-white mt-3'>{boardData.name}</p>
                        <div className="memberList" style={{ flexGrow: 1, overflowY: 'auto' }}>
                            <div className="d-flex align-items-center mb-2 text-white">
                                <IoMdPeople size={20} className="me-2" /> <span>Thành Viên Trong Bảng</span>
                            </div>
                            {memberList.length ? memberList.map((member, idx) => (
                                <div
                                    key={idx}
                                    className="d-flex align-items-center bg-white p-2 mb-2 rounded"
                                    onMouseEnter={() => setHoveredMember(member.email)}
                                    onMouseLeave={() => setHoveredMember(null)}
                                >
                                    <img src={member.avatar || 'https://i.postimg.cc/W4mxd35T/avt.png'} alt="avatar" className="rounded-circle" style={{ width: "40px", height: "40px" }} />
                                    <div className="ms-2" style={{ flex: '1', overflow: 'hidden' }}>
                                        <p className="mb-0 fw-bold text-truncate" style={{ maxWidth: '100%' }}>{member.fullName || member.email}</p>
                                        <p className="mb-0 text-muted text-truncate" style={{ fontSize: "12px", maxWidth: '100%' }}>{member.email}</p>
                                    </div>
                                    {hoveredMember === member.email && member.email !== userProfile?.email && userProfile?.email === boardData?.owner_id && (
                                        <button
                                            className="btn btn-danger btn-sm ms-auto"
                                            style={{ backgroundColor: '#242A30' }}
                                            onClick={() => handleRemoveMember(member.email)}
                                        >
                                            ❌
                                        </button>
                                    )}
                                </div>
                            )) : <p className="text-white fst-italic">Chưa có thành viên nào</p>}
                        </div>
                        <button className="d-flex rounded align-items-center justify-content-center" style={{ height: '40px', backgroundColor: '#EF5855' }} onClick={handleClose}>Trang chủ</button>
                    </div>

                    {/* sidebar màn hình nhỏ */}
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
                            <p className='text-white mt-3'>{boardData.name}</p>
                            <div className="memberList" style={{ flexGrow: 1, overflowY: 'auto' }}>
                                <div className="d-flex align-items-center mb-2 text-white">
                                    <IoMdPeople size={20} className="me-2" /> <span>Thành Viên</span>
                                </div>
                                {memberList.length ? memberList.map((member, idx) => (
                                    <div
                                        key={idx}
                                        className="d-flex align-items-center bg-white p-2 mb-2 rounded"
                                        onMouseEnter={() => setHoveredMember(member.email)}
                                        onMouseLeave={() => setHoveredMember(null)}
                                    >
                                        <img src={member.avatar || 'https://i.postimg.cc/W4mxd35T/avt.png'} alt="avatar" className="rounded-circle" style={{ width: "40px", height: "40px" }} />
                                        <div className="ms-2" style={{ flex: '1', overflow: 'hidden' }}>
                                            <p className="mb-0 fw-bold text-truncate" style={{ maxWidth: '100%' }}>{member.fullName || member.email}</p>
                                            <p className="mb-0 text-muted text-truncate" style={{ fontSize: "12px", maxWidth: '100%' }}>{member.email}</p>
                                        </div>
                                        {hoveredMember === member.email && member.email !== userProfile?.email && userProfile?.email === boardData?.owner_id && (
                                            <button
                                                className="btn btn-danger btn-sm ms-auto"
                                                style={{ backgroundColor: '#242A30' }}
                                                onClick={() => handleRemoveMember(member.email)}
                                            >
                                                ❌
                                            </button>
                                        )}
                                    </div>
                                )) : <p className="text-white fst-italic">Chưa có thành viên nào</p>}
                            </div>
                            <button className="d-flex rounded align-items-center justify-content-center" style={{ height: '40px', backgroundColor: '#EF5855' }} onClick={handleClose}>Trang Chủ</button>
                        </div>
                    )}
                    <div className="bg-white" style={{ flex: 1, overflow: 'hidden' }}>
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center text-white p-3" style={{ height: 'auto', backgroundColor: '#743254 ' }}>
                            <h5 className="mb-2 mb-sm-0" style={{ color: '#ffffffff' }}>{boardData.name}</h5>
                            <Button variant="outline-light bg-black" size="sm" onClick={() => setShowInviteModal(true)}>
                                Mời Thành viên
                            </Button>
                        </div>
                        <div className="container-fluid mt-3" style={{ height: '100%', overflowY: 'auto' }}>
                            <div className="row">
                                {statuses.map(status => (
                                    <div key={status} className="col-lg-3 col-md-4 col-sm-6 col-12 mb-3" style={{ minWidth: '280px' }}>
                                        <div className="card shadow-sm">
                                            <div className="card-header d-flex justify-content-between align-items-center bg-black" style={{ color: '#9b9999ff' }}>
                                                <span>{status}</span>
                                                <div>
                                                    <Dropdown>
                                                        <Dropdown.Toggle variant="secondary" size="sm" id={`dropdown-${status}`}>
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu>
                                                            <Dropdown.Item onClick={() => handleEditList(status)}>Sửa</Dropdown.Item>
                                                            <Dropdown.Item onClick={() => handleDeleteList(status)}>Xóa</Dropdown.Item>
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
                                                    Thêm nhiệm vụ 
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="col-lg-3 col-md-4 col-sm-6 col-12 mb-3 d-flex align-items-start" style={{ minWidth: '280px' }}>
                                    <button className="btn btn-outline-secondary text-white w-100" style={{ backgroundColor: '#a54878ff ' }} onClick={handleAddList}>
                                        Thêm Danh Sách Trạng Thái
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
                    <div style={{ backgroundColor: '#242A30' }}>
                        <Modal.Header closeButton>
                            <Modal.Title style={{ color: '#fff' }}>Thông Tin Cá Nhân</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: '#ffffffff' }} >Họ và Tên</Form.Label>
                                    <Form.Control type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: '#ffffffff' }}>Link Avatar</Form.Label>
                                    <Form.Control type="text" value={formData.avatar} onChange={e => setFormData({ ...formData, avatar: e.target.value })} />
                                </Form.Group>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowProfileModal(false)}>Hủy</Button>
                            <Button style={{ backgroundColor: '#242A30' }} onClick={handleProfileSave}>Lưu</Button>
                        </Modal.Footer>
                    </div>
                </Modal>

                <Modal show={showCardModal} onHide={() => setShowCardModal(false)}>
                    <div style={{ backgroundColor: '#242A30' }}>
                        <Modal.Header closeButton>
                            <Modal.Title style={{ color: '#fff' }}>{cardForm.id ? "Sửa Nhiệm Vụ" : "Thêm Nhiệm Vụ Mới"}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: '#fff' }} placeholder = "Tên Nhiệm Vụ">Tên Nhiệm Vụ</Form.Label>
                                    <Form.Control type="text" value={cardForm.name} onChange={e => setCardForm({ ...cardForm, name: e.target.value })} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label style={{ color: '#fff' }} placeholder = " Mô Tả">Mô Tả</Form.Label>
                                    <Form.Control as="textarea" rows={3} value={cardForm.description} onChange={e => setCardForm({ ...cardForm, description: e.target.value })} />
                                </Form.Group>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowCardModal(false)}>Hủy</Button>
                            <Button style={{ backgroundColor: '#242A30' }} onClick={handleSaveCard}>Save</Button>
                        </Modal.Footer>
                    </div>
                </Modal>
                <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)}>
                    <div style={{ backgroundColor: '#242A30' }}>
                        <Modal.Header closeButton>
                            <Modal.Title style={{ color: '#fff' }}>Mời Thành Viên Vào Bảng</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Control type="email" placeholder="Nhập email" value={invitedEmail} onChange={e => setInvitedEmail(e.target.value)} />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
                                Hủy
                            </Button>
                            <Button style={{ backgroundColor: '#242A30' }} onClick={handleInvite}>
                                Mời
                            </Button>
                        </Modal.Footer>
                    </div>
                </Modal>
                <Modal show={showListModal} onHide={() => setShowListModal(false)}>
                    <div style={{ backgroundColor: '#242A30' }}>
                        <Modal.Header closeButton>
                            <Modal.Title style={{ color: '#ffffffff' }}>{listForm.oldName ? "Edit List" : "Add New List"}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label style={{ color: '#ffffffff' }}>{listForm.oldName ? "New List Name" : "List Name"}</Form.Label>
                                <Form.Control type="text" value={listForm.newName} onChange={e => setListForm({ ...listForm, newName: e.target.value })} />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowListModal(false)}>Hủy</Button>
                            <Button style={{ backgroundColor: '#242A30' }} onClick={handleSaveList}>Save</Button>
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
            </div>
        </DndContext>

    );
}