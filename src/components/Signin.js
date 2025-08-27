import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../img/logo.png';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Spinner } from 'react-bootstrap';

export default function Signin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [popup, setPopup] = useState(false);
  const [popupWaiting, setPopupWaiting] = useState(false);


  const handleLogin = async (e) => {
    e.preventDefault();
    setPopupWaiting(true);
    const response = await fetch("http://localhost:3000/auth/request-code-signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (response.ok) {
      setPopupWaiting(false);
      setTimeout(() => {
        navigate("/verify-otp", { state: { email, authType: "signin" } });
      },);

    } else {
      if (data.error?.includes("Don't have account yet?")) {
        setPopup(true)
      }
    }
  };

  const signUpRedirect = () => {
    setPopup(false);
    navigate("/signup", { state: { email } });
  };

  const closePopup = () => {
    setPopup(false);
  };

  return (
    <div className="d-flex justify-content-center align-items-center vw-100 vh-100 bg-light p-30">
      <form onSubmit={handleLogin} className="border rounded bg-white shadow" style={{ width: '500px', textAlign: 'center', padding: '50px' }}>
        <img src={logo} alt="logo" className="mb-3" style={{ width: '100px', height: '100px' }} />
        <h4 className="mb-3">Log in to continue</h4>
        <input
          type="email"
          className="form-control mb-3 h-50px text-center"
          placeholder="Enter your email"
          style={{ height: "50px" }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary w-100 mb-2" style={{ height: "50px" }}>Continue</button>
        <p>
          <a href="/signup">I don't have account</a>
        </p>
        <p className="small text-muted mb-0">Privacy Policy</p>
        <p className="small text-muted">
          This site is protected by reCAPCHA and the Google Privacy Policy and Terms of Service apply
        </p>
      </form>

      <Modal show={popupWaiting} centered>
        <Modal.Body className="text-center">
          <Spinner animation="border" className="mb-2" />
          <p>Waiting...</p>
        </Modal.Body>
      </Modal>

      <Modal show={popup} onHide={() => setPopup(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Don't have account yet?</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <Button variant="primary" className="mb-2 w-100" onClick={signUpRedirect}>
            Register Now
          </Button>
          <Button variant="link" onClick={() => setPopup(false)}>No! Thank</Button>
        </Modal.Body>
      </Modal>
    </div>);
}